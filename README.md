# azimuth-cli
The azimuth-cli is "Bridge for the command line." It should allow ship owners and operators to do the same things that they can in Bridge but via the command line, and in batch mode.

## Install

### Prerequisites
Due to an issues when building the azimuth-js package (as described [here](https://github.com/ransonhobbes/stardust/issues/12)), which is a dependecny of the cli, it might be necessary to use a node version <= 14. We recommend v14.17.4.

### Install via npm
Simply install the npm package globally:  
`npm install -g azimuth-cli`

**NOTE: the npm package is not published at the moment, please follow the development install below.**

## Usage
After installing the npm package, just type `azimuth-cli` in the command line to see the options. You can also use `azi` for short.

Make sure you are in a directory where files can be written to. Some commands do not need a directory to function, like `azi list children ~zod`, but most others, especially the ones that modify the blockchain, do need to have a work directory. By default, the current directory is the work directory, but it can be changed via the `-d` or `--work-dir` option.

There are three main types of commands: `list`, `generate`, and `modify`. First, the `list` commands do not make any changes, they just print information to the command line. But `generate` commands usually save something to the current work directory; use this, for example, to generate HD wallets. The `modify` commands actually change the blockchain and usually require the private key of the urbit point you are making a change to. They also save data to the work directory, such as Ethereum transaction receipts.

More complicated operations--such as spawning ships, keying them, and transfering them to master tickets--cannot be executed in a single command. Multiple commands need to be called in order. However, all commands are indempotent, which means you can call all those commands multiple times, in the same work directory, and the intended end-state is only executed once, even if one or more commands fail a few times in between.


### Example
#### Spawn, Set Netork Keys, and Transfer to Master Ticket
This is an example of spawning planets and creating a master ticket for them. You would do this if you want to give some planets away to friends. It is similar to what you can do in Bridge, but we do it for 5 planets in one go. Generating a master ticket itself is not enough, though. Ownership needs to be transferred to the owner address that is associated with the master ticket. But for the master ticket to be usable, networking keys need to be set. Hence, we first spawn to a temporary address (usually the same as the owner or spawn-proxy of the star, here ~sardys), then set the keys, and only then move the planet to its own address--that of the HD wallet.

```
# pick 5 random, unspawned planets under ~sardys and save them in a file
azi generate spawn-list ~sardys --count=5 --pick=random

# now, generate HD wallet files based on the previous list
azi generate wallet --file=spawn-list.txt

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


## Development or Manual Install
### Setup
1) Clone this [repo](https://github.com/lukebuehler/azimuth-cli)
1) run `npm install`
1) run `npm link` to enable calling of the cli direcly via the `azimuth-cli` command.

Call `npm unlink` to remove the cli linking.

### Testing
Simply run all tests like so:  
`npm run test`



