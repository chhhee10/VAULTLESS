use anchor_lang::prelude::*;

// This is a placeholder ID. When you deploy, Anchor will generate a new one.
declare_id!("32Ve1hyCBwPDg2Br2v16aV9hq5xAkquE5gYif9v4akb1");

#[program]
pub mod vaultless {
    use super::*;

    /// Registers a new behavioral identity.
    /// In Vaultless V2, we store the Fuzzy Extractor's "Helper Data" on-chain.
    pub fn initialize_identity(ctx: Context<InitializeIdentity>, helper_data: String) -> Result<()> {
        let identity = &mut ctx.accounts.identity;
        identity.owner = ctx.accounts.user.key();
        identity.helper_data = helper_data;
        identity.enrolled_at = Clock::get()?.unix_timestamp;
        identity.last_auth_at = 0;
        identity.is_locked = false;
        
        msg!("Vaultless Identity Initialized for {}", identity.owner);
        Ok(())
    }

    /// Overwrites existing helper data (Re-enrollment)
    pub fn update_identity(ctx: Context<UpdateIdentity>, new_helper_data: String) -> Result<()> {
        let identity = &mut ctx.accounts.identity;
        identity.helper_data = new_helper_data;
        msg!("Vaultless Identity Updated for {}", identity.owner);
        Ok(())
    }

    /// Triggers the Duress protocol silently
    pub fn trigger_duress(ctx: Context<TriggerDuress>) -> Result<()> {
        let identity = &mut ctx.accounts.identity;
        // Note: For a true ghost session, you might not want to lock it immediately, 
        // but just emit the event so the backend indexer / email alert fires.
        identity.is_locked = true; 
        
        emit!(DuressEvent {
            owner: identity.owner,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Vaultless Duress Protocol Activated for {}", identity.owner);
        Ok(())
    }

    /// Logs a successful authentication on-chain (optional, for auditing/UI)
    pub fn authenticate(ctx: Context<Authenticate>) -> Result<()> {
        let identity = &mut ctx.accounts.identity;
        identity.last_auth_at = Clock::get()?.unix_timestamp;
        
        emit!(AuthEvent {
            owner: identity.owner,
            timestamp: identity.last_auth_at,
        });

        msg!("Vaultless Authentication logged for {}", identity.owner);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeIdentity<'info> {
    #[account(
        init, 
        payer = user, 
        // Space breakdown:
        // 8  bytes  — Anchor account discriminator
        // 32 bytes  — owner Pubkey
        // 4  bytes  — String length prefix for helper_data
        // 4096 bytes — helper_data content (fuzzy extractor JSON, typically 1–3 KB)
        // 8  bytes  — enrolled_at i64 timestamp
        // 8  bytes  — last_auth_at i64 timestamp
        // 1  byte   — is_locked bool
        space = 8 + 32 + (4 + 4096) + 8 + 8 + 1, 
        seeds = [b"identity", user.key().as_ref()],
        bump
    )]
    pub identity: Account<'info, Identity>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateIdentity<'info> {
    #[account(
        mut,
        seeds = [b"identity", user.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub identity: Account<'info, Identity>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct TriggerDuress<'info> {
    #[account(
        mut,
        seeds = [b"identity", user.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub identity: Account<'info, Identity>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Authenticate<'info> {
    #[account(
        mut,
        seeds = [b"identity", user.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub identity: Account<'info, Identity>,
    pub user: Signer<'info>,
}

#[account]
pub struct Identity {
    pub owner: Pubkey,
    pub helper_data: String,
    pub enrolled_at: i64,
    pub last_auth_at: i64,
    pub is_locked: bool,
}

#[event]
pub struct DuressEvent {
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AuthEvent {
    pub owner: Pubkey,
    pub timestamp: i64,
}
