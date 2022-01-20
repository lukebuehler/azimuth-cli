# azimuth-cli
The azimuth-cli is "Bridge for the command line." It should allow ship owners and operators to do the same things that they can in Bridge but via the command line, and in batch mode.

## Install

### Prerequisites
Install updated versions of azimuth-js (currently in my repository). They are currently file linked and need to be installed side-by-side.

Also, due to other issues with building the azimuth Solidity contracts, an older version of node might be neeed. We recommend v14.17.4

### Install
1) run `npm install`
2) run `npm link` to enable calling of the cli direcly

### Uninstall
Call `npm unlink` to remove the cli linking.

