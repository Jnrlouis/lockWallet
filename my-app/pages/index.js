import Head from "next/head";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { providers, Contract, BigNumber, utils } from "ethers";
import { useEffect, useRef, useState } from "react";
import WalletConnectProvider from '@walletconnect/web3-provider';
import { TIMELOCK_CONTRACT_ABI, TIMELOCK_CONTRACT_ADDRESS } from "../constants";
//npm install react-loader-spinner --save
//import React from "react";
import Loader from "react-loader-spinner";
//import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";


export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState();
  const [addressBalance, setAddressBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState();
  const [withdrawDate, setWithdrawDate] = useState();
  const [unixWithdrawDate, setUnixWithdrawDate] = useState();
  const [extendTime, setExtendTime] = useState();
  const [izLoading, setIzLoading] = useState(false);
  const [isProv, setIsProv] = useState(false);
  const web3ModalRef = useRef();
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
          rpc: {
              97: "https://data-seed-prebsc-1-s1.binance.org:8545",
            },
          chainId: 97,
        },
    },
  };

  let provider;

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask Or WalletConnect
    console.log("getProviderOrSigner Called");
    
    if (!isProv) {
      // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
      provider = await web3ModalRef.current.connect();
      setIsProv(true);
    };

    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Smart Chain Testnet network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 97) {
      window.alert("Change the network to Smart Chain Test");
      throw new Error("Change network to Smart Chain Test");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  useEffect( async () => {
    // if Provider is true and ethereum is injected
    if (ethereum) {
      if (isProv) {
        provider = await web3ModalRef.current.connect();
      }
    }
  },
  );


  const getBalance = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      setConnectedAddress(address);
      const timelockContract = new Contract(
        TIMELOCK_CONTRACT_ADDRESS,
        TIMELOCK_CONTRACT_ABI,
        signer);
      let bal = await timelockContract.getBalances();
      bal = utils.formatEther(bal);
      setAddressBalance(bal);
      console.log("balance is: ",bal);
      return addressBalance;

    } catch (err) {
      console.error(err);
    }
  };

  const deposit = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const timelockContract = new Contract(
        TIMELOCK_CONTRACT_ADDRESS,
        TIMELOCK_CONTRACT_ABI,
        signer
      );
      console.log("Deposit amount: ", depositAmount);
      let addMoney = await timelockContract.deposit({value: depositAmount});
      setIzLoading(true);
      await addMoney.wait();
      await getBalance();
      await getLocktime();
      setIzLoading(false);

    } catch (err) {
      console.error(err);
    }
  };

  const withdraw = async () => {
    try {
      if ( unixWithdrawDate > Date.now()/1000) {
        console.log("Withdrawal not allowed");
        alert("LOCKED! You can only withdraw after the Timelock", {withdrawDate});
      } else {
        const signer = await getProviderOrSigner(true);
        const timelockContract = new Contract(
          TIMELOCK_CONTRACT_ADDRESS,
          TIMELOCK_CONTRACT_ABI,
          signer
        );
        console.log("Withdraw All");
        let withdrawMoney = await timelockContract.withdraw();
        setIzLoading(true);
        await withdrawMoney.wait();
        await getBalance();
        setWithdrawDate("Not Available");
        setIzLoading(false);
      }

    } catch (err) {
      console.error(err);
    }
  };

  const getLocktime = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const timelockContract = new Contract(
        TIMELOCK_CONTRACT_ADDRESS,
        TIMELOCK_CONTRACT_ABI,
        signer
      );
      
      let locktime = await timelockContract.getLockTime();
      setUnixWithdrawDate(locktime.toString());
      locktime = new Date (locktime * 1000);
      console.log("Get Locktime", locktime.toString());
      setWithdrawDate(locktime.toString());

    } catch (err) {
      console.error(err);
    }
  };

  const increaseLockTime = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const timelockContract = new Contract(
        TIMELOCK_CONTRACT_ADDRESS,
        TIMELOCK_CONTRACT_ABI,
        signer
      );
      let extendedDate = extendTime.toString();
      extendedDate = new Date(extendedDate).getTime() / 1000
      let difference = extendedDate - unixWithdrawDate;
      console.log("difference: ", difference);
      if (extendedDate - unixWithdrawDate < 0) {
        alert("Extended Date should be further from Withdrawal Date");
      } else {
        extendedDate = extendedDate - unixWithdrawDate;
        const increaseTime = await timelockContract.increaseLockTime(extendedDate);
        setIzLoading(true);
        await increaseTime.wait();
        await getLocktime();
        setIzLoading(false);
      }

    } catch (err) {
      console.error(err);
    }
  };

  const connectWallet = async () => {
    try {
      web3ModalRef.current = new Web3Modal({
        //network: "smart chain testnet",
        providerOptions,
        cacheProvider: true,
        disableInjectedProvider: false,
      });
      provider = await web3ModalRef.current.connect();
      setIzLoading(true);
      await getBalance();
      await getLocktime();
      setIzLoading(false);
      if (ethereum || isProv) {
        setWalletConnected(true);
      }
       
    } catch (err) {
      console.error(err);
    }
  };

  const onDisconnect = async () => {
    try {
      setIsProv(false);
      await web3ModalRef.current.clearCachedProvider();
      provider = await web3ModalRef.current.clearCachedProvider();
      setWalletConnected(false);
      console.log("Disconnected");

    } catch (err) {
      console.error(err);
    }
  };

  const loading = () => (
    <div className={styles.loads}>
      <h6 className ={styles.description2}> This may take few seconds :) </h6>
    </div>
  );

  const renderConnect = () => {
    if (walletConnected) {
      return (
        <div>
          <div className={styles.description}>
            <strong>Wallet Address Connected:</strong> {connectedAddress}
            <br/>
            <strong> Total Amount Locked:</strong> {addressBalance}
            <br/>
            <strong> Withdraw Date:</strong> {withdrawDate}
            <br/>
            <label>
              Deposit:    
              <input
                id= "deposit"
                type="number"
                min="0.1"
                step= "0.1"
                placeholder="Amount of BNB"
                onChange={(e) => setDepositAmount(utils.parseEther(e.target.value || "0"))}
                className={styles.input}
              />
              <button className={styles.button1} onClick={deposit}>
                Lock It Up 💸
              </button>
            </label>
            <br/>
            <label> 
              Extend Withdrawal Date:
              <input
                type="datetime-local"
                id="withdrawalTime"
                className={styles.inputDate}
                onChange={(e) => setExtendTime(e.target.value || "0")}
              />
              <button className={styles.button3} onClick={increaseLockTime}>
                Increase Time 🚀
              </button>
            </label>
          </div>
          <button className={styles.button2} onClick={withdraw}>
            Break Kolo
          </button>
          <div>
            <button onClick={onDisconnect} className={styles.button}>
            Disconnect Wallet
            </button>
          </div>

        </div>

      )
    }
    
  };

  const renderOnDisconnect = () => (
    <button onClick={connectWallet} className={styles.button}>
      Connect Wallet
    </button>
  );


  return (
    <div>
      <Head>
        <title>Kolo</title>
        <meta name="description" content="TimeLock Wallet" />
        <link rel="icon" href="/treasurechest.png" />
      </Head>
      <div className={styles.main}>
        <div className={styles.body}>
          <div className={styles.titleHead}>
            <h1 className={styles.title}>Kolo </h1>
            <img className={styles.image} src="/treasurechest.png" alt="Treasure Chest"></img>
          </div>
      
          <div className={styles.description1}>
            Lock up your coins in this kolo for rainy days
          </div>
          <div className={styles.description3}>
            Coins are locked for a minimum of 1 day. Feel free to HODL longer 💪 
          </div>
          <div className={styles.description}>
            {walletConnected ?
              renderConnect()
            : renderOnDisconnect()}
            <div>
              <br/><br/><br/>
              {izLoading == true ?
                loading()
              : null}
            </div>
          
          </div>
          
          <footer className={styles.footer}>
            Made with &#10084; by:  <a href="https://www.twitter.com/@Jnrlouis" target = "_blank" rel="noreferrer"> @Jnrlouis</a>
          </footer>
        </div>

      </div>


    </div>
  );

}