
import { useEffect, useState, useCallback, useMemo } from 'react';
import { ckTESTBTCClient, BoostStatus, type BoostRequest } from '@ckboost/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, RefreshCw, Zap, TrendingUp, Clock, AlertCircle, Filter } from 'lucide-react';
import { getPlatformUserIds, getPlatformUserCount } from '../services/platformUserRegistry';

export default function BoosterStatsPage() {
    const [allRequests, setAllRequests] = useState<BoostRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
    const [platformOnly, setPlatformOnly] = useState(true); // Default to platform-only

    // Initialize client directly to access all requests
    const [client] = useState(() => new ckTESTBTCClient({
        host: 'https://icp-api.io',
        timeout: 30000
    }));

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await client.getPendingBoostRequests();
            if (result.success) {
                // Sort by ID descending (newest first)
                const sorted = [...result.data].sort((a, b) => Number(b.id) - Number(a.id));
                setAllRequests(sorted);
                setLastUpdated(Date.now());
            } else {
                setError(result.error?.message || 'Failed to fetch requests');
            }
        } catch (e) {
            setError('Network error or failed to connect');
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    useEffect(() => {
        fetchStats();
        // Auto refresh every 30s
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    // Get platform users and filter requests
    const platformUserIds = useMemo(() => getPlatformUserIds(), [allRequests]);
    const platformUserCount = getPlatformUserCount();

    // Filtered requests based on toggle
    const requests = useMemo(() => {
        if (!platformOnly) return allRequests;
        return allRequests.filter(r => r.owner && platformUserIds.has(r.owner.toString()));
    }, [allRequests, platformOnly, platformUserIds]);

    // Derived Stats - from filtered requests
    const totalPending = requests.filter(r => r.status === BoostStatus.PENDING).length;
    const totalVolume = requests.reduce((acc, r) => acc + parseFloat(r.amount), 0);
    const avgFee = requests.length > 0
        ? requests.reduce((acc, r) => acc + r.maxFeePercentage, 0) / requests.length
        : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative min-h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <Zap className="w-8 h-8 text-yellow-500" />
                        Booster Network Stats
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time monitoring of the CKBoost network queues
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                        Updated: {new Date(lastUpdated).toLocaleTimeString()}
                    </span>
                    <Button
                        variant={platformOnly ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatformOnly(!platformOnly)}
                        className="flex items-center gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        {platformOnly ? `Platform Only (${platformUserCount})` : 'All Requests'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchStats}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
                        <Clock className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPending}</div>
                        <p className="text-xs text-muted-foreground">in the public queue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending Volume</CardTitle>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVolume.toFixed(4)} ckBTC</div>
                        <p className="text-xs text-muted-foreground">waiting to be boosted</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Max Fee</CardTitle>
                        <Zap className="w-4 h-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgFee.toFixed(2)}%</div>
                        <p className="text-xs text-muted-foreground">offered by users</p>
                    </CardContent>
                </Card>
            </div>

            {/* Requests Table */}
            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle>Request Queue</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">User (Owner)</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount (ckBTC)</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Fee Cap</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Confirmations</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {requests.length === 0 && !isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                            No pending requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs">{req.id.toString()}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {req.createdAt ? new Date(Number(req.createdAt) / 1000000).toLocaleString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs max-w-[150px] truncate" title={req.owner?.toString()}>
                                                {req.owner?.toString()}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">{req.amount}</td>
                                            <td className="px-4 py-3 text-right">{req.maxFeePercentage}%</td>
                                            <td className="px-4 py-3 text-right">{req.confirmationsRequired.toString()}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline - flex items - center px - 2.5 py - 0.5 rounded - full text - xs font - medium ${req.status === BoostStatus.PENDING ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    req.status === BoostStatus.ACTIVE ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        'bg-gray-100 text-gray-800'
                                                    } `}>
                                                    {req.status === BoostStatus.PENDING ? 'Pending' : req.status === BoostStatus.ACTIVE ? 'Active' : 'Unknown'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {isLoading && requests.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="animate-spin w-4 h-4" /> Loading requests...
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
