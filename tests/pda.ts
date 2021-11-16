import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Keypair, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import assert from 'assert';
import { Rarity } from '../target/types/rarity';
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";


describe('pda', () => {
  let provider = anchor.Provider.env();
  let mint: Token = null;
  let mintAddresss = null;

  const mintAuthority = Keypair.generate();

  anchor.setProvider(provider)


  const program = anchor.workspace.Rarity as Program<Rarity>;

  it('Creates a metadata account for mint', async () => {


    const payer = Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, 0.1 * LAMPORTS_PER_SOL),
      "confirmed"
    );

    mint = await Token.createMint(
      provider.connection,
      payer,
      mintAuthority.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID
    );



    const tokenAccount = await mint.createAccount(provider.wallet.publicKey);
    await mint.mintTo(
      tokenAccount,
      mintAuthority.publicKey,
      [mintAuthority],
      1
    );

    mintAddresss = mint.publicKey.toBase58();
    const prefix = "n_metadata";
    const [mintPda, _] = await PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode(prefix)),
        mint.publicKey.toBuffer(),
      ],
      program.programId
    );

    const rarity = {
      uncommon: {},
    };

    await program.rpc.addMetadata(new anchor.BN(1),rarity, {
      accounts: {
        authority: provider.wallet.publicKey,
        mint: mint.publicKey,
        mintData: mintPda,
        systemProgram: SystemProgram.programId,
      }
    })

    let mintData = await program.account.mintData.fetch(
      mintPda
    );


    assert.ok(mintData.rank.toNumber() === 1);
    assert.deepEqual(mintData.rarity,rarity);
  })

  it('Update metadata account for mint', async () => {

    //To test fail case change the 
    const wallet = Keypair.generate();
    const address = new anchor.web3.PublicKey(mintAddresss);
    const prefix = "n_metadata";
    const [mintPda, _] = await PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode(prefix)),
        address.toBuffer(),
      ],
      program.programId
    );

    const rarity = {
      legendary: {},
    };
    await program.rpc.updateMetadata(new anchor.BN(100), rarity, {
      accounts: {
        authority: provider.wallet.publicKey,
        mint: mintAddresss,
        mintData: mintPda
      },
    })

    let mintData = await program.account.mintData.fetch(
      mintPda
    );

    assert.ok(mintData.rank.toNumber() === 100);
    assert.deepEqual(mintData.rarity,rarity);
  });


  it('Failed metadata update for mint', async () => {

    //To test fail case change the 
    const wallet = Keypair.generate();
    const address = new anchor.web3.PublicKey(mintAddresss);
    const prefix = "n_metadata";
    const [mintPda, _] = await PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode(prefix)),
        address.toBuffer(),
      ],
      program.programId
    );

    const rarity = {
      uncommon: {},
    };
    
    await program.rpc.updateMetadata(new anchor.BN(1), rarity, {
      accounts: {
        authority: wallet.publicKey,
        mint: mintAddresss,
        mintData: mintPda
      },
    })

    let mintData = await program.account.mintData.fetch(
      mintPda
    );

    assert.ok(mintData.rank.toNumber() === 100);
    assert.deepEqual(mintData.rarity,rarity);
  });
})
