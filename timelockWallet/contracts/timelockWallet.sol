// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TimeLock {
    address _owner;
    constructor() {
        _owner= msg.sender;
    }
    mapping(address => uint) public balances;
    mapping(address => uint) public lockTime;

    function owner() public view returns(address) {
        address owner_ = _owner;
        return owner_;
    }
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        lockTime[msg.sender] = block.timestamp + 1 days;
    }

    function getBalances() public view returns (uint) {
        return balances[msg.sender];
    }

    function getLockTime() public view returns (uint) {
        return lockTime[msg.sender];
    }

    function increaseLockTime(uint _secondsToIncrease) public {
        lockTime[msg.sender] += _secondsToIncrease;
    }

    function withdraw() public {
        require(balances[msg.sender] > 0, "Insufficient funds");
        require(block.timestamp > lockTime[msg.sender], "Lock time not expired");

        uint amount = balances[msg.sender];
        balances[msg.sender] = 0;

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }
}