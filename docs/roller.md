# Using the Azimuth-CLI with your own L2 Roller

The [Layer 2 (L2) scaling solution](https://urbit.org/docs/azimuth/l2/layer2) was introduced in early 2022 as an alternative way to manage Urbit IDs, to aleviate the problem of high transaction costs on Ethereum. Before L2, each Urbit ID transaction had to be executed on the Ethereum blockchain, with costs per transaction ranging from $20-$100.

The offcial Urbit roller (running here: https://roller.urbit.org/v1/roller) has quite a low quota of transaction per ship. If you want to, say, spawn 100 planets, you need to run your own roller.

## Setting Up Ethereum Accounts

Before you can start, you need a few Ethereum accounts. We will assume you have a star that wants to spawn and manage planets, but the setup would work similarly in other scenarios too.

Use something like MetaMask to manage your accounts. The nice thing is, once your star is migrated to L2, most of the accounts listed here do not need any ETH to work. The roller will pay for the transactions.

To indicate what address and private key is referd to later, we'll give each an alias here, e.g., 0xOwner, 0xOwnerKey. Of course, they should be substituted by the actual Ethereum address and private key.

To get the private key in MetaMask, click on an account, select "Account Details" and then "Export Private Key". 

### 1) Transfer Star or Spawn to L2
Assuming you own a star, log in to [Bridge](https://bridge.urbit.org/) and migrate your star or the spawn capability of your star to L2 (I recommend that you only move the ability to spwan). This is an L1 transaction and the account needs ETH.

`0xOwner`, `0xOwnerKey`

### 2) Create Spawn Proxy Account and Configure Star (Optional)
Create a new account that will act as the L2 spawn proxy for your planets. In Bridge, once the migration to L2 has completed, set the spawn proxy to this address.

`0xSpawnProxy`, `0xSpawnProxyKey`

### 2) Create Management Proxy Account (Optional)
This is only needed if you plan to host the planets, because you'll want to be able to transfer ownership while remaining management proxy of the planets, which is needed to set and reset the network keys.

Create a new account that will act as the L2 management proxy for your planets.

`0xManagementProxy`

### 2) Create Roller Account
The roller needs access to ETH. Create an account to which you can transfer some ETH. I recommend to transfer first $100 or so while testing. This should allow to spawn at least 50 planets.

`0xRoller`, `0xRollerKey`

## Setting Up the Roller

### Preliminaries

*This is based on this tutorial: https://pastebin.com/wQDw7nHv*

Make sure you have Urbit v1.8 or later [installed](https://urbit.org/getting-started/cli).

Create an account with [Infura](https://infura.io/) and make sure to copy the infura URL, something like: `https://mainnet.infura.io/v3/YOURSPECIALKEY`. Alternatively you can also use your own Ethereum node, but we will assume you are using Infura.

### Configure a Roller
1) Boot a fakezod: `./urbit -F zod`
2) Once booted, set the Ethereum node: `:azimuth|watch 'https://mainnet.infura.io/v3/YOURSPECIALKEY' %default`
3) Make sure the subscription works: `:azimuth %resub`
4) Start roller agents: `|rein %base [& %roller] [& %roller-rpc] [& %azimuth-rpc]`
5) Set roller Ethereum node: `:roller|endpoint 'https://mainnet.infura.io/v3/YOURSPECIALKEY' %mainnet`
6) Give the roller access to your "Roller Account" (see above): `:roller|setkey '0xRollerKey'`
7) Increase the quota, so you can do larger batches: `:roller|quota 100`
8) If you want to also connect via a local Brige instance, also set this: `|cors-approve 'http://localhost:3000'`

To test, you can now do requests via command line:
```
curl --location --request POST 'http://localhost:8080/v1/roller' --header 'Content-Type: application/json' --data-raw '{
    "jsonrpc": "2.0",
    "method": "getPoint",
    "params": {
        "ship": "~sampel"
    },
    "id": "1234"
}'
```
Replace `~sampel` with your star name. It should show dominion as `l2` or `spawn`.

For a more cURL examples, [see here](https://documenter.getpostman.com/view/16338962/Tzm3nx7x).

### Helpful Dojo Commands

 * Send the current batch to the blockchain (by default, the batch is sent on the hour, every hour): `:roller|commit`
 * Check if there is any Ethereum state pending (it should return 0): `:eth-watcher +dbug [%state '(lent pending-logs:(~(got by dogs) /azimuth))']`
 * See how many azimuth logs there are: `:azimuth +dbug [%state '(lent logs)']`

## Spawn Planets Using the Azimuth-CLI

Clone the latest version from from `https://github.com/lukebuehler/azimuth-cli` and switch to the `l2` branch (`git checkout l2`). Follow the  development install instructions in the readme. You should be able to type `azi` in the command line and see the azimuth-cli options, including `list-l2` and `modify-l2`. Make sure you are on node version 14.x.x.

If you don't see the l2 commands, you are not on the right version. Maybe you have the cli already installed globally? Do `npm uninstall -g azimuth-cli` first and then install again.

Copy one line after the other to the command line. This will just spawn two random planets, you can change the `spawn-list.txt` file however you want.

```
azi generate spawn-list ~sampel --count=2 --pick=random --use-roller

azi generate wallet --points-file=spawn-list.txt

azi generate network-key --use-wallet-files

azi modify-l2 spawn --use-wallet-files --address=0xSpawnProxy --private-key=0xSpawnProxyKey

azi modify-l2 management-proxy --use-wallet-files --address=0xManagementProxy --private-key=0xSpawnProxyKey

azi modify-l2 network-key --use-wallet-files --private-key=0xSpawnProxyKey

azi modify-l2 transfer --use-wallet-files --private-key=0xSpawnProxyKey 
```







