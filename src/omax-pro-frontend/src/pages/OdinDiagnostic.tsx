import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEnhancedOdinAPI } from '../hooks/useOdinAPI';

const ODIN_API_BASE = "https://api.odin.fun/v1";

async function fetchRawOdinTokens() {
    const response = await fetch(`${ODIN_API_BASE}/tokens?limit=5&sort=marketcap:desc`);
    if (!response.ok) throw new Error('Failed to fetch raw');
    return response.json();
}

export default function OdinDiagnostic() {
    const [expectedUsd, setExpectedUsd] = useState<string>('');

    // 1. Fetch RAW data directly
    const { data: rawData, isLoading: rawLoading } = useQuery({
        queryKey: ['odin', 'raw_diagnostic'],
        queryFn: fetchRawOdinTokens
    });

    // 2. Fetch ENHANCED data via our hook
    const { tokens: enhancedTokens, isLoading: enhancedLoading, btcPriceUSD } = useEnhancedOdinAPI({
        limit: 5,
        sort: "marketcap:desc"
    });

    if (rawLoading || enhancedLoading) return <div className="p-10">Loading diagnostic data...</div>;

    const calculateScalar = (raw: number, targetUsd: number, btcPrice: number) => {
        if (!targetUsd || !btcPrice) return 'N/A';
        // Raw * Scalar * BTC_Price = Target_USD
        // Scalar = Target_USD / (Raw * BTC_Price)
        const scalar = targetUsd / (raw * btcPrice);
        return scalar.toExponential(4);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto bg-white min-h-screen text-slate-900">
            <h1 className="text-3xl font-bold mb-6">Odin API Calibration</h1>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h2 className="font-bold">BTC Price: ${btcPriceUSD?.toLocaleString()}</h2>
                <div className="mt-4">
                    <label className="block text-sm font-bold mb-2">Calibration Tool</label>
                    <p className="text-sm mb-2">Pick a token below. Enter the price you SEE on odin.fun in USD.</p>
                    <input
                        type="number"
                        className="border p-2 rounded"
                        placeholder="e.g. 0.0025"
                        value={expectedUsd}
                        onChange={(e) => setExpectedUsd(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {rawData?.data?.map((rawToken: any, index: number) => {
                    const enhancedToken = enhancedTokens.find(t => t.id === rawToken.id);
                    if (!enhancedToken) return null;

                    return (
                        <div key={rawToken.id} className="border p-4 rounded bg-gray-50">
                            <h3 className="text-xl font-bold mb-2">{rawToken.name} ({rawToken.ticker})</h3>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-red-50 p-3 rounded">
                                    <h4 className="font-bold text-red-800 border-b border-red-200 mb-2">RAW API</h4>
                                    <pre className="text-xs overflow-auto">
                                        Price:      {rawToken.price}
                                        MarketCap:  {rawToken.marketcap}
                                        Volume 24h: {rawToken.volume_24}
                                        Decimals:   {rawToken.decimals}
                                        Supply:     {rawToken.total_supply}
                                    </pre>
                                </div>

                                <div className="bg-green-50 p-3 rounded">
                                    <h4 className="font-bold text-green-800 border-b border-green-200 mb-2">CURRENT APP (USD)</h4>
                                    <pre className="text-xs overflow-auto">
                                        Price: ${enhancedToken.priceFormatted.usd}
                                        MCap:  ${enhancedToken.marketCapFormatted.usd}
                                    </pre>
                                    <div className="mt-2 text-xs">
                                        Logic: Raw * 0.00000001 * BTC_Price
                                    </div>
                                </div>

                                <div className="bg-purple-50 p-3 rounded">
                                    <h4 className="font-bold text-purple-800 border-b border-purple-200 mb-2">CALCULATED SCALAR</h4>
                                    {expectedUsd ? (
                                        <div>
                                            <p className="text-xs">If true price is ${expectedUsd}:</p>
                                            <p className="font-mono font-bold text-lg">
                                                {calculateScalar(rawToken.price, parseFloat(expectedUsd), btcPriceUSD)}
                                            </p>
                                            <p className="text-xs mt-2">
                                                Expected multiplier to fix it.
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500">Enter expected USD above to calculate.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
