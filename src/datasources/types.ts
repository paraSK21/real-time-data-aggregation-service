export type RawToken = {
	token_address: string;
	token_name?: string;
	token_ticker?: string;
	price_sol?: number;
	market_cap_sol?: number;
	volume_sol?: number;
	liquidity_sol?: number;
	transaction_count?: number;
	price_1hr_change?: number;
	protocol?: string;
	source: string;
};

export type UnifiedToken = {
	token_address: string;
	token_name: string;
	token_ticker: string;
	price_sol: number;
	market_cap_sol?: number;
	volume_sol?: number;
	liquidity_sol?: number;
	transaction_count?: number;
	price_1hr_change?: number;
	sources: string[];
};

export interface DataSourceClient {
	search(query: string): Promise<RawToken[]>;
	byTokenAddress(address: string): Promise<RawToken | null>;
	name: string;
}
