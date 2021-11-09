# azimuth-cli
The azimuth-cli is "Bridge for the command line." It should allow ship owners and operators to do the same things that they can in Bridge but via the command line, and in batch mode.

This project is an Urbit.org grant proposal: https://urbit.org/grants/azimuth-cli

## Install

### Prerequisites
Install updated versions of azimuth-solidity and azimuth-js (currently in my repository). They are currently file linked and need to be installed side-by-side.

Make sure you are on node version 10 or lower (because of an old version of web3)
`nvm install 10 --lts`
This is needed because some of the dependecies are not supported with node v greater than 10, e.g. [scrypt](https://stackoverflow.com/a/66597645/408710)

### Install
1) run `npm install`
2) run `npm link` to enable calling of the cli direcly

### Uninstall
Call `npm unlink` to remove the cli linking.

