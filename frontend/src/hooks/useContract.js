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
    [getContract]
  );

  const write = useCallback(
    async (method, ...args) => {
      try {
        setLoading(true);
        setError(null);
        const contract = getContract();
        if (!contract) throw new Error('Contract not initialized');
        const tx = await contract[method](...args);
        const receipt = await tx.wait();
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
