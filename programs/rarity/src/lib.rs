
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use anchor_lang::solana_program::pubkey::Pubkey;

declare_id!("5xYiyYKXxh2DNinm2PF6oUgkskF1aaRbKX753FYit5AJ");

const PREFIX: &str = "n_metadata";
const CENTRAL_AUTHORITY: anchor_lang::prelude::Pubkey = Pubkey::new_from_array(
    [5, 160, 181, 17, 63, 223, 239, 157, 145, 118, 246, 79, 
                56, 54, 65, 214, 202, 196, 172, 187,19, 146, 47, 240, 78, 
                151, 162, 116, 135, 21, 104, 11]);

#[program]
mod rarity {
    use super::*;


    pub fn add_metadata(ctx: Context<AddMetadata> , rarity : RarityChart) -> ProgramResult {
        let state = &mut ctx.accounts.mint_data;
        state.rarity = rarity;
        state.authority = ctx.accounts.authority.to_account_info().key();
        Ok(())
    }

    pub fn update_metadata(ctx: Context<UpdateMetadata> ,  rarity : RarityChart) -> ProgramResult {
        let state = &mut ctx.accounts.mint_data;
        state.rarity = rarity;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [PREFIX.as_bytes(), mint.key().as_ref()],
        bump
    )]
    pub mint_data: ProgramAccount<'info, MintData>,
    #[account(constraint = authority.key == &CENTRAL_AUTHORITY.key() @ErrorCode::Unauthorized)]
    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>
}


#[derive(Accounts)]
pub struct AddMetadata<'info> {
    #[account(signer,constraint = authority.key == &CENTRAL_AUTHORITY.key() @ErrorCode::Unauthorized)]
    pub authority: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    #[account(init_if_needed ,seeds = [PREFIX.as_bytes(),mint.key().as_ref()],bump, payer = authority, space= 8 + std::mem::size_of::<MintData>())]
    pub mint_data: Account<'info, MintData>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MintData {
    pub rarity: RarityChart,
    pub authority: Pubkey
}


#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub enum RarityChart {
    Common,
    Uncommon,
    Rare,
    UltraRare,
    Legendary
}


#[error]
pub enum ErrorCode {
    #[msg("You are not authorized to call this action.")]
    Unauthorized
}



