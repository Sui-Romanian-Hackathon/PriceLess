// import { Transaction } from "@mysten/sui/transactions";
// import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
// import { useState } from "react";
// import { ConnectButton } from "@mysten/wallet-kit";

// const PACKAGE_ID = /*process.env.PACKAGE_ID ||*/ "0x";
// const COUNTER_ID = /*process.env.COUNTER_ID ||*/ "0x";

// export default function CounterPage() {
//   const account = useCurrentAccount();
//   const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
//   const [loading, setLoading] = useState(false);
//   const [digest, setDigest] = useState<string | null>(null);

//   const handleIncrement = async () => {
//     if (!account) return alert("Conectează portofelul mai întâi.");
//     setLoading(true);
//     try {
//       const tx = new Transaction();
//       tx.moveCall({
//         target: `${PACKAGE_ID}::counter::add_value`,
//         arguments: [tx.object(COUNTER_ID), tx.pure.u64(1)],
//       });

//       const res = await signAndExecuteTransaction({
//         transaction: tx,
//         chain: "sui:testnet",
//       });

//       setDigest(res.digest);
//       console.log("Tranzacție:", res);
//     } catch (e) {
//       console.error(e);
//       alert("Eroare la trimitere tranzacție");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6">
//       <ConnectButton />
//       <div className="mt-4">
//         <button
//           onClick={handleIncrement}
//           disabled={!account || loading}
//           className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
//         >
//           {loading ? "Se procesează..." : "Crește counterul"}
//         </button>
//       </div>

//       {digest && (
//         <p className="mt-3">
//           Digest: <code>{digest}</code>
//         </p>
//       )}
//     </div>
//   );
// }
