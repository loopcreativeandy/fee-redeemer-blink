import {ActionGetResponse, ActionPostResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, } from "@solana/actions"
import {Connection, Keypair, PublicKey, SystemProgram, Transaction, clusterApiUrl} from "@solana/web3.js"

export async function GET(request: Request) {
  const responseBody : ActionGetResponse = {
    icon: "https://solana-asset-recovery.vercel.app/solandy-logo.png",
    description: "This is Solandys demo blink.",
    title: "DO BLINK!",
    label: "Click me!",
    links: 
      {
        actions: [
          {
            href: request.url,
            label: "same action"
          }, 
            
            {
              href: request.url+"?action=another",
              label: "another action"
            },
            
            {
              href: request.url+"?action=nickname&param={nameParam}&amount={amountParam}",
              label: "with param",
              parameters: [
                {
                  name: "nameParam",
                  label: "nickname",
                  required: true
                },
                // {
                //   name: "amountParam",
                //   label: "amount",
                //   required: true
                // }
              ]
            },
            {
              href: request.url+"?action=nickname&param={nameParam}",
              label: "another with param",
              parameters: [
                {
                  name: "nameParam",
                  label: "nickname",
                  required: true
                },
              ]
            },
            {
              href: request.url+"?action=nickname&param={nameParam}",
              label: "another with param",
              parameters: [
                {
                  name: "nameParam",
                  label: "nickname",
                  required: true
                },
              ]
            },
            {
              href: request.url+"?action=nickname&param={nameParam}",
              label: "another with param",
              parameters: [
                {
                  name: "nameParam",
                  label: "nickname",
                  required: true
                },
              ]
            },
            {
              href: request.url+"?action=nickname&param={nameParam}",
              label: "another with param",
              parameters: [
                {
                  name: "nameParam",
                  label: "nickname",
                  required: true
                },
              ]
            }
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
  const action = url.searchParams.get('action');
  const param = url.searchParams.get('param');
  console.log("performing action "+action)

  const user = new PublicKey(userPubkey)

  const seed = new Uint8Array(32);
  seed[28] = 42;
  const kp = Keypair.fromSeed(seed);
  
  console.log("using keypair "+kp.publicKey)

  const connection = new Connection(clusterApiUrl("mainnet-beta"));
  const ix = SystemProgram.transfer({
    fromPubkey: user,
    toPubkey: new PublicKey('SfezQZ31AnSoSGDZa74DvQEgG3QX26pHhdpHfVxddam'),
    lamports: 1
  })  
  let name = userPubkey;
  const tx = new Transaction();
  if (action =="another") {
    tx.add(ix)
  } else if (action == "nickname") {
    name = param!
  }

  tx.feePayer = kp.publicKey
  const bh = (await connection.getLatestBlockhash({commitment: "finalized"})).blockhash; 
  console.log("using blockhash "+bh)
  tx.recentBlockhash = bh
  tx.sign(kp);
  const serialTX = tx.serialize({requireAllSignatures: false, verifySignatures: false}).toString("base64");

  const response : ActionPostResponse = {
    transaction: serialTX,
    message: "hello "+name
  };
  return Response.json(response, {headers: ACTIONS_CORS_HEADERS})
}


export async function OPTIONS(request: Request) {
  return new Response(null, {headers: ACTIONS_CORS_HEADERS})
}