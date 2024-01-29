# azimuth-cli

This is a command line tool to work with Urbit ID, which is the idenity layer behind [Urbit](https://urbit.org/) and is managed as a set of NFTs on the Ethereum blockchain.

The azimuth-cli is "Bridge for the command line." It should allow Urbit ship owners and operators to do the same things that they can in [Bridge](https://bridge.urbit.org/) but via the command line, and in batch mode.

The primary functionality of the cli is to query and modify the [azimuth contracts](https://github.com/urbit/azimuth) on Ethereum.

## Install

### Prerequisites
Due to an issues when building the azimuth-js package (as described [here](https://github.com/ransonhobbes/stardust/issues/12)), which is a dependecny of the cli, it might be necessary to use a node version <= 14. We recommend v14.17.4.

### Install via npm
Simply install the npm package globally:  
`npm install -g azimuth-cli`

**When Upgrading to the L2 version:** Make sure to delete the `cli-config.json` file in your home directory, usually in a folder called `.azimuth/`.

### Development or Manual Install
1) Clone this [repo](https://github.com/lukebuehler/azimuth-cli)
1) run `npm install`
1) run `npm link` to enable calling of the cli direcly via the `azimuth-cli` command.

Call `npm unlink` to remove the cli linking.

To run the tests:  
`npm run test`


## Usage

*Note: Using the CLI with a L2 roller is WIP, see [here for instructions](docs/roller.md).*

After installing the npm package, just type `azimuth-cli` in the command line to see the options. You can also use `azi` for short.

There are three main types of commands: `get`, `generate`, and `modify`. First, the `get` commands do not make any changes, they just print information to the command line. But `generate` commands usually save something to the current work directory; use this, for example, to generate HD wallets. 

The `modify` commands actually change the blockchain and usually require the private key of the address that owns the urbit point you are making a change to. The `modify` commands have two versions: `modify-l1` and `modify-l2`. This is because Urbit IDs can either be modified directly through an Ethereum smart contract called Azimuth, aka "L1", or via a Layer 2 solution that is cheaper, which uses a "roller" that gathers transactions that modify Urbit IDs and then submits them as one batch to Ethereum, and is called the "L2" solution. The `modify` commands also save data to the work directory, such as Ethereum or roller transaction receipts.

More complicated operations--such as spawning ships, keying them, and transfering them to master tickets--cannot be executed in a single command. Multiple commands need to be called in order (see the examples below).

### Setting Up Your Own Layer 2 Roller
If you want to modify large batches of points in one go--for example spawn 200 planets--then you need to [run your own roller](docs/roller.md). By default, the CLI points to the official roller run by Urbit. See the `--roller-provider` option in the CLI.

### Work Directory & Idempotent Commands
Many commands, especially the `generate` and `modify` ones, need a work directory to fulfill their function. The reason for this is that a command may be called multiple times, but the end effect needs to always be the same. For example, if you call `azi generate spawn-list --count=10` multiple times, the resulting `spawn-list.txt` file will only be created once, and will not change in subsequent calls (unless the `--force` option is provided). The same goes for the `modify` commands.

This is a nice feature if you wan to script an action that takes multiple cli commands to complete. Even if one command fails, you can just call the entire script again and again until the end-state is achieved.

The work directory is the current folder or can be supplied with the `--work-dir=/my/dir` option.

### Commands

For the full documentation, please install the cli and explore the commands and sub-commands with the `--help` option.

`aimuth-cli`
 * `get` - Retrieves data about points, rollers, and azimuth, and prints it to the console. By default, uses a L2 roller to get the information.
   * `children <point>` - Lists all child points of a certain Urbit point.
   * `owner <address>` - Lists all points owned by that Ethereum address.
   * `details <point>` - Prints details about the point.
   * `gas-price` - Outputs the current Etherum gas prices. This is helpful if you want to provide a gas limit in the `modify-l1` commands.
   * `roller-info` - Prints details about the L2 roller.
   * `roller-info` - Prints pending roller transactions.
 * `generate` - Generates various files that can be used in the `modify` commands.
   * `spawn-list <point>` - Creates a `spawn-list.txt` file that contains a number of points that can be spawned under the provided point.
   * `wallet` - Generates an HD wallet for each provided point and saves each wallet in JSON format in the current work directory. Use this especially if you plan to give the points away. Then, in subsequent commands, supply the `--use-wallet-files` option.
   * `network-keys` - Creates the network keyfile for each supplied point, and either creates a JSON file with the private and public network keys or uses the network keys from the walled files. 
   * `report` - Generates a CSV report for the provided points, containing patp, p, ticket, network keys, addresses, and transactions executed so far.
 * `modify-l1` - Modifies the state of one or more points on the Ethereum blockchain (the azimuth contracts). For many of these commands to work, other files will have to have been generated with the `generate` commands.
   * `spawn` - Spawns multiple points to the supplied address
   * `management-proxy` - Sets the management proxy address for the points.
   * `spawn-proxy` - Sets the spawn-proxy address for the points.
   * `network-key` - Sets the network keys for the points, which is required to be able to boot the Urbit.
   * `transfer` - Transfers the point to a target address or the wallet files. 
   * `transfer-proxy` - Sets the transfer proxy address for the points.
 * `modify-l2` - Modifies the state of one or more points via a L2 roller. The roller then submits the changes to the L2 Ethereum contract. Any point modified via this command, needs to be on L2.
   * `spawn` - Spawns multiple points to the supplied address. The galaxy or star that spawns needs to be on L2 or the spawn proxy needs to be on L2.
   * `management-proxy` - Sets the management proxy address for the points.
   * `network-key` - Sets the network keys for the points, which is required to be able to boot the Urbit.
   * `transfer` - Transfers the point to a target address or the wallet files. 
   * `transfer-proxy` - Sets the transfer proxy address for the points.

### Examples
#### Spawn, Set Network Keys, and Transfer to Master Ticket on Azimuth (L1)
This is an example of spawning planets and creating a master ticket for them. You would do this if you want to give some planets away to friends. It is similar to what you can do in Bridge, but we do it for 5 planets in one go. Generating a master ticket itself is not enough, though. Ownership needs to be transferred to the owner address that is associated with the master ticket. But for the master ticket to be usable, networking keys need to be set. Hence, we first spawn to a temporary address (usually the same as the owner or spawn-proxy of the star, here ~sardys), then set the keys, and only then move the planet to its own address--that of the HD wallet.

The star you are spawning from needs to be on L1!

```
# create a directory for your work
mkdir spawn-planets
cd spawn-planets

# pick 5 random, unspawned planets under ~sardys and save them in a file
azi generate spawn-list ~sardys --count=5 --pick=random --use-azimuth

# now, generate HD wallet files based on the previous list
azi generate wallet --points-file=spawn-list.txt

# create network keyfiles, used to boot the planets, 
# based on the wallet files from the previous step 
# (the wallet files contain the private and public networking keys)
azi generate network-key --use-wallet-files

# spawn the 5 planets that can be found in the wallet files, 
# providing the PK of the wallet that owns ~sardys, or is the spawn proxy
azi modify-l1 spawn --use-wallet-files --address=0xSardysOwnershipAddress --private-key=0x1234567890

# set the network keys on the blockchain
azi modify-l1 network-key --use-wallet-files --private-key=0x1234567890

# transfer each planet ownership to the address of the wallet
azi modify-l1 transfer --use-wallet-files --private-key=0x1234567890
```

#### Spawn, Set Network Keys, and Transfer to Master Ticket through a Roller (L2)

This is the same example as above but using a roller to spawn the planets.

The star you are spawning from needs to be on L2 or have the spawn proxy set to L2! Here is more info about the [Layer 2 solution](https://urbit.org/docs/azimuth/l2/layer2).

```
azi generate spawn-list ~sampel --count=2 --pick=random --use-roller

azi generate wallet --points-file=spawn-list.txt

azi generate network-key --use-wallet-files

azi modify-l2 spawn --use-wallet-files --address=0xSpawnProxy --private-key=0xSpawnProxyKey

azi modify-l2 management-proxy --use-wallet-files --address=0xManagementProxy --private-key=0xSpawnProxyKey

azi modify-l2 network-key --use-wallet-files --private-key=0xSpawnProxyKey

azi modify-l2 transfer --use-wallet-files --private-key=0xSpawnProxyKey 
```


