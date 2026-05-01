import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';

export const useContract = (contractAddress, contractABI) => {
  const { provider, signer } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getContract = useCallback(() => {
    if (!provider) return null;
    if (!contractAddress || contractAddress === '') {
      throw new Error('Contract address not configured');
    }
    if (!contractABI || !Array.isArray(contractABI)) {
      throw new Error('Contract ABI not configured');
    }
    const contractSigner = signer || provider;
    return new ethers.Contract(contractAddress, contractABI, contractSigner);
  }, [provider, signer, contractAddress, contractABI]);

  const call = useCallback(
    async (method, ...args) => {
      try {
        setLoading(true);
        setError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (!contractAddress || contractAddress === '') {
          throw new Error('Contract address not configured. Please check your environment variables.');
        }
        const contract = getContract();
        if (!contract) throw new Error('Contract not initialized');
        const result = await contract[method](...args);
        return result;
      } catch (err) {
        const errorMessage = err.message || 'Unknown error occurred';
        setError(errorMessage);
        console.error(`Contract call error (${method}):`, err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getContract, contractAddress]
  );

  const write = useCallback(
    async (method, ...args) => {
      try {
        setLoading(true);
        setError(null);
        const contract = getContract();
        if (!contract) throw new Error('Contract not initialized');

        // Copy args so we don't mutate the original array
        let txArgs = [...args];
        let overrides = {};

        if (txArgs.length > 0) {
          const lastArg = txArgs[txArgs.length - 1];

          // ✅ FIX: Added 'gasPrice' to detection — without it, { gasPrice, value }
          // was not recognized as overrides, so value was never sent (0 POL)
          const isOverrides =
            typeof lastArg === 'object' &&
            lastArg !== null &&
            !Array.isArray(lastArg) &&
            (
              lastArg.value !== undefined ||
              lastArg.gasPrice !== undefined ||          // ✅ ADDED
              lastArg.maxFeePerGas !== undefined ||
              lastArg.maxPriorityFeePerGas !== undefined ||
              lastArg.gasLimit !== undefined
            );

          if (isOverrides) {
            overrides = txArgs[txArgs.length - 1];
            txArgs = txArgs.slice(0, -1);
          }
        }

        // Debug logs
        console.log('Calling contract method:', method);
        console.log('Arguments:', txArgs);
        console.log('Overrides:', JSON.stringify(overrides, (key, val) =>
          typeof val === 'bigint' ? val.toString() + 'n' : val
        ));

        // ✅ Explicitly pass value to ensure it's not dropped
        const tx = await contract[method](...txArgs, {
          ...overrides,
          ...(overrides.value !== undefined ? { value: overrides.value } : {}),
        });

        console.log('Transaction submitted:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt.hash);
        return receipt;
      } catch (err) {
        const errorMessage = err.message || 'Unknown error occurred';
        setError(errorMessage);
        console.error(`Contract write error (${method}):`, err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  return { getContract, call, write, loading, error };
};
