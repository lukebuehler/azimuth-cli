# azimuth-cli
The azimuth-cli is "Bridge for the command line." It should allow ship owners and operators to do the same things that they can in [Bridge](https://bridge.urbit.org/) but via the command line, and in batch mode.

The primary usage of the cli is to query and modify the [azimuth contracts](https://github.com/urbit/azimuth) on Ethereum.

## Install

### Prerequisites
Due to an issues when building the azimuth-js package (as described [here](https://github.com/ransonhobbes/stardust/issues/12)), which is a dependecny of the cli, it might be necessary to use a node version <= 14. We recommend v14.17.4.

### Install via npm
Simply install the npm package globally:  
`npm install -g azimuth-cli`

### Development or Manual Install
1) Clone this [repo](https://github.com/lukebuehler/azimuth-cli)
1) run `npm install`
1) run `npm link` to enable calling of the cli direcly via the `azimuth-cli` command.

Call `npm unlink` to remove the cli linking.

To run the tests:  
`npm run test`


## Usage
After installing the npm package, just type `azimuth-cli` in the command line to see the options. You can also use `azi` for short.

There are three main types of commands: `list`, `generate`, and `modify`. First, the `list` commands do not make any changes, they just print information to the command line. But `generate` commands usually save something to the current work directory; use this, for example, to generate HD wallets. The `modify` commands actually change the blockchain and usually require the private key of the address that owns the urbit point you are making a change to. The `modify` commands also save data to the work directory, such as Ethereum transaction receipts.

More complicated operations--such as spawning ships, keying them, and transfering them to master tickets--cannot be executed in a single command. Multiple commands need to be called in order (see the example below).

### Work Directory & Idempotent Commands
Many commands, especially the `generate` and `modify` ones, need a work directory to fulfill their function. The reason for this is that a command may be called multiple times, but the end effect needs to always be the same. For example, if you call `azi generate spawn-list --count=10` multiple times, the resulting `spawn-list.txt` file will only be created once, and will not change in subsequent calls (unless the `--force` option is provided). The same goes for the `modify` commands.

This is a nice feature if you wan to script an action that takes multiple cli commands to complete. Even if one command fails, you can just call the entire script again and again until the end-state is achieved.

The work directory is the current folder or can be supplied with the `--work-dir=/my/dir` option.

### Commands

For the full documentation, please install the cli and explore the commands and sub-commands with the `--help` option.

`aimuth-cli`
 * `list` - Prints azimuth data to the console.
   * `children <point>` - Lists all child points of a certain Urbit point.
   * `owner <address>` - Lists all points owned by that Ethereum address.
   * `owner-of <point>` - Prints the Ethereum address that owns the point.
   * `spawn-proxy-of <point>` - Prints the Ethereum address that is the spawn proxy of the point.
   * `gas-price` - Outputs the current Etherum gas prices. This is helpful if you want to provide a gas limit in the `modify` commands.
 * `generate` - Generates various files that can be used in the `modify` commands.
   * `spawn-list <point>` - Creates a `spawn-list.txt` file that contains a number of points that can be spawned under the provided point.
   * `wallet` - Generates an HD wallet for each provided point and saves each wallet in JSON format in the current work directory. Use this especially if you plan to give the points away. Then, in subsequent commands, supply the `--use-wallet-files` option.
   * `network-keys` - Creates the network keyfile for each supplied point, and either creates a JSON file with the private and public network keys or uses the network keys from the walled files. 
   * `report` - Generates a CSV report for the provided points, containing patp, p, ticket, network keys, addresses, and transactions executed so far.
 * `modify` - Modifies the state of one or more points on the Ethereum blockchain (the azimuth contracts). For many of these commands to work, other files will have to have been generated with the `generate` commands.
   * `spawn` - Spawns multiple points to the supplied address
   * `management-proxy` - Sets the management proxy address for the points.
   * `spawn-proxy` - Sets the spawn-proxy address for the points.
   * `network-key` - Sets the network keys for the points, which is required to be able to boot the Urbit.
   * `transfer` - Transfers the point to a target address or the wallet files. 


### Examples
#### Spawn, Set Network Keys, and Transfer to Master Ticket
This is an example of spawning planets and creating a master ticket for them. You would do this if you want to give some planets away to friends. It is similar to what you can do in Bridge, but we do it for 5 planets in one go. Generating a master ticket itself is not enough, though. Ownership needs to be transferred to the owner address that is associated with the master ticket. But for the master ticket to be usable, networking keys need to be set. Hence, we first spawn to a temporary address (usually the same as the owner or spawn-proxy of the star, here ~sardys), then set the keys, and only then move the planet to its own address--that of the HD wallet.

```
# create a directory for your work
mkdir spawn-planets
cd spawn-planets

# pick 5 random, unspawned planets under ~sardys and save them in a file
azi generate spawn-list ~sardys --count=5 --pick=random

# now, generate HD wallet files based on the previous list
azi generate wallet --points-file=spawn-list.txt

# create network keyfiles, used to boot the planets, 
# based on the wallet files from the previous step 
# (the wallet files contain the private and public networking keys)
azi generate network-key --use-wallet-files

# spawn the 5 planets that can be found in the wallet files, 
# providing the PK of the wallet that owns ~sardys, or is the spawn proxy
azi modify spawn --use-wallet-files --address=0xSardysOwnershipAddress --private-key=0x1234567890

# set the network keys on the blockchain
azi modify network-key --use-wallet-files --private-key=0x1234567890

# transfer each planet ownership to the address of the wallet
azi modify transfer --use-wallet-files --private-key=0x1234567890
```




