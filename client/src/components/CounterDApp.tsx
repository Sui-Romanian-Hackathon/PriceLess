import { useState, useEffect, type FC } from "react";
import {
  useSuiClient,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Plus, Loader2, RefreshCw, Hand, Zap } from "lucide-react";

const COUNTER_OBJECT_STORAGE_KEY = "sui_counter_id";

const CounterDApp: FC = () => {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const [counterId, setCounterId] = useState<string | null>(
    localStorage.getItem(COUNTER_OBJECT_STORAGE_KEY)
  );
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [isLoadingValue, setIsLoadingValue] = useState(false);
  const [latestTxStatus, setLatestTxStatus] = useState<
    "idle" | "success" | "error" | string
  >("idle");

  const PACKAGE_ID = import.meta.env.VITE_COUNTER_PACKAGE_ID;

  const fetchCounterValue = async (id: string) => {
    if (!client || !id || !account?.address) return;

    setIsLoadingValue(true);
    try {
      const object = await client.getObject({
        id,
        options: {
          showContent: true,
        },
      });

      const valField = (object.data?.content as any)?.fields?.val;

      if (valField !== undefined) {
        setCurrentValue(Number(valField));
        setLatestTxStatus("idle");
      } else {
        console.warn("Could not find 'val' field in counter object.", object);
        setCurrentValue(null);
      }
    } catch (error) {
      console.error("Error fetching counter value:", error);
      setLatestTxStatus("Error fetching value. Maybe the object was deleted?");
      setCurrentValue(null);
    } finally {
      setIsLoadingValue(false);
    }
  };

  const findCounterInAccount = async () => {
    if (!client || !account?.address || PACKAGE_ID === "0x0") return;

    setLatestTxStatus("Searching for the new Counter object in your wallet...");

    try {
        const objects = await client.getOwnedObjects({
            owner: account.address,
            filter: {
                StructType: `${PACKAGE_ID}::counter::Counter`,
            },
            options: {
                showContent: false,
            },
        });
        
        if (objects.data.length > 0) {
            const newCounterId = objects.data[0].data?.objectId;
            
            if (newCounterId) {
                setCounterId(newCounterId);
                localStorage.setItem(COUNTER_OBJECT_STORAGE_KEY, newCounterId);
                setLatestTxStatus(`Counter found in account! ID set.`);
                fetchCounterValue(newCounterId);
                return;
            }
        }
        
        setLatestTxStatus("No Counter object found in your account.");
    } catch (error) {
        console.error("Error finding Counter object:", error);
        setLatestTxStatus("Critical error during account search.");
    }
  };

  useEffect(() => {
    if (counterId && account?.address) {
      fetchCounterValue(counterId);
    } else if (account?.address && PACKAGE_ID !== "0x0") {
      findCounterInAccount();
    }
  }, [counterId, account?.address, client]);


  const handleCreateCounter = () => {
    if (!account?.address || PACKAGE_ID === "0x0") {
      alert("Wallet not connected or PACKAGE_ID is missing.");
      return;
    }

    setLatestTxStatus("idle");
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::counter::new`,
      arguments: [],
    });

    signAndExecute(
      {
        transaction: tx,
        showEffects: true, 
      } as any,
      {
        onSuccess: result => {
            console.log("Create Transaction Success:", result);
            setLatestTxStatus("Counter created. Waiting for confirmation...");
            
            setTimeout(() => {
                findCounterInAccount();
            }, 3000); 
        },
        onError: (error: any) => {
          console.error("Create Counter Failed:", error);
          setLatestTxStatus(
            "Error creating counter: " + (error?.message || String(error))
          );
        },
      }
    );
  };

  const handleAddValue = (value: number) => {
    if (!counterId || !account?.address) {
      alert("Please create a Counter first!");
      return;
    }

    setLatestTxStatus("idle");
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::counter::add_value`,
      arguments: [
        tx.object(counterId),
        tx.pure.u64(value), // 1 added to the counter
      ],
    });

    signAndExecute(
      {
        transaction: tx,
        showEffects: true,
      } as any,
      {
        onSuccess: result => {
          console.log("Add Value Success:", result);
          setLatestTxStatus(`Successfully added ${value}!`);
          fetchCounterValue(counterId);
        },
        onError: error => {
          console.error("Add Value Failed:", error);
          setLatestTxStatus("Error adding value: " + error.message);
        },
      }
    );
  };

  if (PACKAGE_ID === "0x0") {
    return (
      <div className="p-8 max-w-xl mx-auto bg-yellow-100 border border-yellow-400 rounded-lg mt-8 shadow-md">
        <h2 className="text-xl font-bold text-yellow-700">
          Configuration Required
        </h2>
        <p className="mt-2 text-yellow-600">
          Please set <code>VITE_COUNTER_PACKAGE_ID</code> in your{" "}
          <code>.env</code> file to the actual Sui Package ID of your deployed
          contract.
        </p>
      </div>
    );
  }

  if (!account?.address) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center mt-8">
        <p className="text-xl text-gray-600 flex items-center justify-center">
          <Hand size={24} className="mr-2 text-blue-500" /> Connect your Sui
          Wallet to interact with the Counter.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-xl shadow-2xl mt-8 border-t-4 border-indigo-500">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <Zap size={28} className="mr-2 text-indigo-500" /> Sui Counter Contract
        Interaction
      </h1>

      <div className="mb-8 p-6 bg-indigo-50 rounded-lg border border-indigo-200">
        <p className="text-lg font-semibold text-indigo-700 mb-2">
          {counterId
            ? "Current Counter Object ID:"
            : "Status: No Counter Created"}
        </p>
        {counterId ? (
          <div className="bg-white p-3 rounded-md font-mono text-sm break-all text-gray-700 border">
            {counterId}
          </div>
        ) : (
          <p className="text-gray-500">Press 'Create Counter' to start.</p>
        )}
      </div>

      <div className="flex items-center justify-between p-6 bg-gray-100 rounded-lg shadow-inner mb-8">
        <h2 className="text-2xl font-extrabold text-gray-800">
          Counter Value:
        </h2>
        <div className="flex items-center space-x-4">
          <span className="text-5xl font-extrabold text-indigo-600">
            {isLoadingValue ? (
              <Loader2 className="animate-spin text-indigo-400" size={36} />
            ) : currentValue !== null ? (
              currentValue
            ) : (
              "--"
            )}
          </span>
          <button
            onClick={() => counterId && fetchCounterValue(counterId)}
            disabled={!counterId || isLoadingValue}
            className="p-2 bg-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-300 transition disabled:opacity-50"
            title="Refresh Value"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* --- Actions --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleCreateCounter}
          disabled={isPending || !!counterId}
          className={`py-3 rounded-lg font-bold transition flex items-center justify-center text-lg ${
            isPending
              ? "bg-gray-400 cursor-not-allowed"
              : counterId
              ? "bg-green-600/50 text-white opacity-70 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white shadow-lg"
          }`}
        >
          {isPending ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Plus size={20} className="mr-2" />
          )}
          {counterId ? "Counter Exists" : "1. Create New Counter"}
        </button>

        <button
          onClick={() => handleAddValue(1)}
          disabled={isPending || !counterId}
          className={`py-3 rounded-lg font-bold transition flex items-center justify-center text-lg ${
            isPending || !counterId
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
          }`}
        >
          {isPending ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Plus size={20} className="mr-2" />
          )}
          2. Add Value (+1)
        </button>
      </div>

      <div className="mt-6 text-sm p-3 rounded-lg bg-gray-50 border">
        Status:{" "}
        <span className="font-mono text-gray-600 break-all">
          {latestTxStatus}
        </span>
      </div>
    </div>
  );
};

export default CounterDApp;