// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestToken
 * @dev Simple ERC20 token for testing the rental platform
 */
contract TestToken is ERC20, Ownable {
    
    constructor() ERC20("Farm Token", "FARM") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    
    /**
     * @dev Mint tokens (for testing)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Faucet - allow users to mint test tokens
     */
    function faucet(uint256 amount) public {
        require(amount <= 1000 * 10 ** decimals(), "Max 1000 tokens per faucet call");
        _mint(msg.sender, amount);
    }
}
