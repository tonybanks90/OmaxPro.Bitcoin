// src/components/prediction/MarketDebugPanel.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MarketsService } from '../../services/markets-service';
import { Code, RefreshCw, DollarSign } from 'lucide-react';

interface MarketDebugPanelProps {
    marketId: string;
}

export function MarketDebugPanel({ marketId }: MarketDebugPanelProps) {
    const [marketInfo, setMarketInfo] = useState<any>(null);
    const [yesPrice, setYesPrice] = useState<number | null>(null);
    const [noPrice, setNoPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMarketData = async () => {
        setLoading(true);
        setError(null);

        try {
            const id = BigInt(marketId);

            // Get market info
            const info = await MarketsService.getMarketInfo(id);
            setMarketInfo(info);
            console.log('Market Info:', info);

            // Get YES token price
            try {
                const yesPriceResult = await MarketsService.getMarketPrice(id, {
                    Binary: { YES: null }
                });
                setYesPrice(yesPriceResult);
                console.log('YES Price:', yesPriceResult);
            } catch (e) {
                console.error('Error getting YES price:', e);
            }

            // Get NO token price
            try {
                const noPriceResult = await MarketsService.getMarketPrice(id, {
                    Binary: { NO: null }
                });
                setNoPrice(noPriceResult);
                console.log('NO Price:', noPriceResult);
            } catch (e) {
                console.error('Error getting NO price:', e);
            }

        } catch (err: any) {
            console.error('Error fetching market data:', err);
            setError(err.message || 'Failed to fetch market data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-2 border-dashed border-warning/50 bg-warning/5">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Code className="w-5 h-5 text-warning" />
                        <span className="text-warning">Debug Panel</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchMarketData}
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Fetch Data
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Market Info */}
                {marketInfo && (
                    <div className="space-y-3">
                        <div className="bg-surface border border-border rounded-lg p-3">
                            <h4 className="font-semibold text-sm mb-2 flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                Market State
                            </h4>
                            <div className="space-y-1 text-xs font-mono">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Market ID:</span>
                                    <span>{marketId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge variant={marketInfo.isActive ? "default" : "secondary"} className="text-xs">
                                        {marketInfo.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                {marketInfo.liquidityParameter && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Liquidity (b):</span>
                                        <span className="text-success">{marketInfo.liquidityParameter}</span>
                                    </div>
                                )}
                                {marketInfo.totalSupply && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Supply:</span>
                                        <span>{marketInfo.totalSupply.toString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Token Prices */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-success/10 border border-success/50 rounded-lg p-3">
                                <div className="text-xs text-muted-foreground mb-1">YES Token Price</div>
                                <div className="font-bold text-success">
                                    {yesPrice !== null ? yesPrice.toFixed(8) : 'Loading...'}
                                </div>
                            </div>
                            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
                                <div className="text-xs text-muted-foreground mb-1">NO Token Price</div>
                                <div className="font-bold text-destructive">
                                    {noPrice !== null ? noPrice.toFixed(8) : 'Loading...'}
                                </div>
                            </div>
                        </div>

                        {/* Raw Data */}
                        <details className="bg-muted/50 rounded-lg p-3">
                            <summary className="cursor-pointer text-xs font-semibold mb-2">
                                Raw Market Data (Click to expand)
                            </summary>
                            <pre className="text-xs overflow-auto max-h-64 bg-background p-2 rounded">
                                {JSON.stringify(marketInfo, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}

                {!marketInfo && !loading && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                        Click "Fetch Data" to load market information
                    </div>
                )}

                {/* Helper Info */}
                <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-2">
                    <div className="font-semibold">💡 Troubleshooting Tips:</div>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>If slippage is 100%, the market may need initial liquidity</li>
                        <li>Check that liquidityParameter (b) is set (recommended: 100+)</li>
                        <li>Verify totalSupply is sufficient for trading</li>
                        <li>Use smaller bet amounts for testing (e.g., $1-10)</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
