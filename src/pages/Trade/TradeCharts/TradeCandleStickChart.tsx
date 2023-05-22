import {
    DetailedHTMLProps,
    HTMLAttributes,
    memo,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { CandleData, LiquidityData } from '../../../utils/state/graphDataSlice';
import Chart from '../../Chart/Chart';
import './TradeCandleStickChart.css';

// import candleStikPlaceholder from '../../../assets/images/charts/candlestick.png';
import { LiquidityDataLocal } from './TradeCharts';
import { useAppSelector } from '../../../utils/hooks/reduxToolkit';
import { getPinnedPriceValuesFromTicks } from '../Range/rangeFunctions';
import { lookupChain } from '@crocswap-libs/sdk/dist/context';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { ChainSpec } from '@crocswap-libs/sdk';
import ChartSkeleton from './ChartSkeleton/ChartSkeleton';

import { chartSettingsMethodsIF } from '../../../App/hooks/useChartSettings';
import { IS_LOCAL_ENV } from '../../../constants';
import {
    diffHashSig,
    diffHashSigCandles,
    diffHashSigLiquidity,
} from '../../../utils/functions/diffHashSig';
import { RangeStateContext } from '../../../contexts/RangeStateContext';
import { CandleContext } from '../../../contexts/CandleContext';
import { candleScale } from '../../../utils/state/tradeDataSlice';

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'd3fc-group': DetailedHTMLProps<
                HTMLAttributes<HTMLDivElement>,
                HTMLDivElement
            >;
            'd3fc-svg': DetailedHTMLProps<
                HTMLAttributes<HTMLDivElement>,
                HTMLDivElement
            >;
        }
    }
}

interface propsIF {
    isUserLoggedIn: boolean | undefined;
    chainData: ChainSpec;
    expandTradeTable: boolean;
    changeState: (
        isOpen: boolean | undefined,
        candleData: CandleData | undefined,
    ) => void;
    chartItemStates: chartItemStates;
    limitTick: number | undefined;
    liquidityData?: LiquidityData;
    isAdvancedModeActive: boolean | undefined;
    simpleRangeWidth: number | undefined;
    truncatedPoolPrice: number | undefined;
    poolPriceDisplay: number | undefined;
    setCurrentData: React.Dispatch<
        React.SetStateAction<CandleData | undefined>
    >;
    setCurrentVolumeData: React.Dispatch<
        React.SetStateAction<number | undefined>
    >;
    upBodyColor: string;
    upBorderColor: string;
    downBodyColor: string;
    downBorderColor: string;
    upVolumeColor: string;
    downVolumeColor: string;
    baseTokenAddress: string;
    quoteTokenAddress: string;
    chainId: string;
    poolPriceNonDisplay: number | undefined;
    selectedDate: number | undefined;
    setSelectedDate: React.Dispatch<number | undefined>;
    rescale: boolean | undefined;
    setRescale: React.Dispatch<React.SetStateAction<boolean>>;
    latest: boolean | undefined;
    setLatest: React.Dispatch<React.SetStateAction<boolean>>;
    reset: boolean | undefined;
    setReset: React.Dispatch<React.SetStateAction<boolean>>;
    showLatest: boolean | undefined;
    setShowLatest: React.Dispatch<React.SetStateAction<boolean>>;
    setShowTooltip: React.Dispatch<React.SetStateAction<boolean>>;
    handlePulseAnimation: (type: string) => void;
    setSimpleRangeWidth: React.Dispatch<React.SetStateAction<number>>;
    setRepositionRangeWidth: React.Dispatch<React.SetStateAction<number>>;
    repositionRangeWidth: number;
    chartSettings: chartSettingsMethodsIF;
    isMarketOrLimitModule: boolean;
}

type chartItemStates = {
    showTvl: boolean;
    showVolume: boolean;
    showFeeRate: boolean;
    liqMode: string;
};

function TradeCandleStickChart(props: propsIF) {
    const {
        isUserLoggedIn,
        chainData,
        baseTokenAddress,
        chainId,
        poolPriceNonDisplay,
        selectedDate,
        setSelectedDate,
        handlePulseAnimation,
        setSimpleRangeWidth,
        setRepositionRangeWidth,
        repositionRangeWidth,
        poolPriceDisplay,
        chartSettings,
        isMarketOrLimitModule,
    } = props;

    const rangeState = useContext(RangeStateContext);

    const {
        candleData: { value: candleData },
        fetchingCandle: { value: fetchingCandle },
        isCandleDataNull: { value: isCandleDataNull },
    } = useContext(CandleContext);

    const period = chartSettings.candleTime.market.time;
    const unparsedCandleData = candleData?.candles;

    const [scaleData, setScaleData] = useState<any>();
    const [liquidityScale, setLiquidityScale] = useState<any>(undefined);
    const [liquidityDepthScale, setLiquidityDepthScale] = useState<any>();
    const [prevPeriod, setPrevPeriod] = useState<any>();
    const [prevFirsCandle, setPrevFirsCandle] = useState<any>();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isCandleAdded, setIsCandleAdded] = useState<boolean>(false);

    const [liqBoundary, setLiqBoundary] = useState<number | undefined>(
        undefined,
    );

    const expandTradeTable = props?.expandTradeTable;

    const tradeData = useAppSelector((state) => state.tradeData);

    const tokenPair = useMemo(
        () => ({
            dataTokenA: tradeData.tokenA,
            dataTokenB: tradeData.tokenB,
        }),
        [
            tradeData.tokenB.address,
            tradeData.tokenB.chainId,
            tradeData.tokenA.address,
            tradeData.tokenA.chainId,
        ],
    );

    const denominationsInBase = tradeData.isDenomBase;
    const isTokenABase = tokenPair?.dataTokenA.address === baseTokenAddress;

    const tokenA = tokenPair.dataTokenA;
    const tokenB = tokenPair.dataTokenB;
    const tokenADecimals = tokenA.decimals;
    const tokenBDecimals = tokenB.decimals;
    const baseTokenDecimals = isTokenABase ? tokenADecimals : tokenBDecimals;
    const quoteTokenDecimals = !isTokenABase ? tokenADecimals : tokenBDecimals;

    const liquidityPullData = useAppSelector(
        (state) => state.graphData.liquidityData,
    );

    const currentPoolPriceTick =
        poolPriceNonDisplay === undefined
            ? 0
            : Math.log(poolPriceNonDisplay) / Math.log(1.0001);

    const candleTimeInSeconds: number = isMarketOrLimitModule
        ? chartSettings.candleTime.market.time
        : chartSettings.candleTime.range.time;

    const {
        candleScale: { setValue: setCandleScale },
    } = useContext(CandleContext);

    useEffect(() => {
        setIsLoading(true);
    }, [candleTimeInSeconds, denominationsInBase]);

    useEffect(() => {
        if (props.liquidityData !== undefined) {
            const barThreshold =
                poolPriceDisplay !== undefined ? poolPriceDisplay : 0;

            const liqBoundaryData = props.liquidityData.ranges.find(
                (liq: any) => {
                    return denominationsInBase
                        ? liq.upperBoundInvPriceDecimalCorrected <
                              barThreshold &&
                              liq.lowerBoundInvPriceDecimalCorrected !== '-inf'
                        : liq.lowerBoundPriceDecimalCorrected > barThreshold &&
                              liq.upperBoundPriceDecimalCorrected !== '+inf';
                },
            );

            const liqBoundaryArg =
                liqBoundaryData !== undefined
                    ? denominationsInBase
                        ? liqBoundaryData.lowerBoundInvPriceDecimalCorrected
                        : liqBoundaryData.upperBoundPriceDecimalCorrected
                    : barThreshold;
            const liqBoundary =
                typeof liqBoundaryArg === 'number'
                    ? liqBoundaryArg
                    : parseFloat(liqBoundaryArg);

            setLiqBoundary(() => liqBoundary);
        }
    }, [
        diffHashSigLiquidity(liquidityPullData),
        denominationsInBase,
        poolPriceDisplay !== undefined && poolPriceDisplay > 0,
    ]);

    useEffect(() => {
        if (props.liquidityData !== undefined) {
            const barThreshold =
                poolPriceDisplay !== undefined ? poolPriceDisplay : 0;

            const liqBoundaryData = props.liquidityData.ranges.find(
                (liq: any) => {
                    return denominationsInBase
                        ? liq.upperBoundInvPriceDecimalCorrected <
                              barThreshold &&
                              liq.lowerBoundInvPriceDecimalCorrected !== '-inf'
                        : liq.lowerBoundPriceDecimalCorrected > barThreshold &&
                              liq.upperBoundPriceDecimalCorrected !== '+inf';
                },
            );

            const liqBoundaryArg =
                liqBoundaryData !== undefined
                    ? denominationsInBase
                        ? liqBoundaryData.lowerBoundInvPriceDecimalCorrected
                        : liqBoundaryData.upperBoundPriceDecimalCorrected
                    : barThreshold;
            const liqBoundary =
                typeof liqBoundaryArg === 'number'
                    ? liqBoundaryArg
                    : parseFloat(liqBoundaryArg);

            setLiqBoundary(() => liqBoundary);
        }
    }, [
        diffHashSigLiquidity(liquidityPullData),
        denominationsInBase,
        poolPriceDisplay !== undefined && poolPriceDisplay > 0,
    ]);

    useEffect(() => {
        IS_LOCAL_ENV && console.debug('setting candle added to true');
        setIsCandleAdded(true);
    }, [diffHashSigCandles(candleData), denominationsInBase]);

    // Parse liquidtiy data
    const liquidityData = useMemo(() => {
        if (
            liqBoundary &&
            props.liquidityData &&
            poolPriceDisplay !== undefined &&
            poolPriceDisplay > 0 &&
            props.liquidityData.curveState.base ===
                props.baseTokenAddress.toLowerCase() &&
            props.liquidityData.curveState.quote ===
                props.quoteTokenAddress.toLowerCase() &&
            props.liquidityData.curveState.poolIdx ===
                props.chainData.poolIndex &&
            props.liquidityData.curveState.chainId === props.chainData.chainId
        ) {
            IS_LOCAL_ENV && console.debug('parsing liquidity data');

            const liqAskData: LiquidityDataLocal[] = [];
            const liqBidData: LiquidityDataLocal[] = [];
            const depthLiqBidData: LiquidityDataLocal[] = [];
            const depthLiqAskData: LiquidityDataLocal[] = [];

            let topBoundary = 0;
            let lowBoundary = 0;

            const lowTick = currentPoolPriceTick - 100 * 101;
            const highTick = currentPoolPriceTick + 100 * 101;

            const rangeBoundary = getPinnedPriceValuesFromTicks(
                denominationsInBase,
                baseTokenDecimals,
                quoteTokenDecimals,
                lowTick,
                highTick,
                lookupChain(chainId).gridSize,
            );

            const limitBoundary = parseFloat(
                rangeBoundary.pinnedMaxPriceDisplay,
            );

            const barThreshold =
                poolPriceDisplay !== undefined ? poolPriceDisplay : 0;

            const domainLeft = Math.min(
                ...props.liquidityData.ranges.map((o: any) => {
                    return o.activeLiq !== undefined
                        ? parseFloat(o.activeLiq)
                        : Infinity;
                }),
            );
            const domainRight = Math.max(
                ...props.liquidityData.ranges.map((o: any) => {
                    return o.activeLiq !== undefined
                        ? parseFloat(o.activeLiq)
                        : 0;
                }),
            );

            const depthBidLeft = Math.min(
                ...props.liquidityData.ranges.map((o: any) => {
                    return o.cumBidLiq !== undefined && o.cumBidLiq !== '0'
                        ? parseFloat(o.cumBidLiq)
                        : Infinity;
                }),
            );
            const depthBidRight = Math.max(
                ...props.liquidityData.ranges.map((o: any) => {
                    return o.cumBidLiq !== undefined && o.cumBidLiq !== '0'
                        ? parseFloat(o.cumBidLiq)
                        : 0;
                }),
            );

            const depthAskLeft = Math.min(
                ...props.liquidityData.ranges.map((o: any) => {
                    return o.cumAskLiq !== undefined && o.cumAskLiq !== '0'
                        ? parseFloat(o.cumAskLiq)
                        : Infinity;
                }),
            );
            const depthAskRight = Math.max(
                ...props.liquidityData.ranges.map((o: any) => {
                    const price = denominationsInBase
                        ? o.upperBoundInvPriceDecimalCorrected
                        : o.upperBoundPriceDecimalCorrected;
                    if (price > barThreshold / 10 && price < limitBoundary) {
                        return o.cumAskLiq !== undefined && o.cumAskLiq !== '0'
                            ? parseFloat(o.cumAskLiq)
                            : 0;
                    }
                    return 0;
                }),
            );

            const liquidityScale = d3
                .scaleLog()
                .domain([domainLeft, domainRight])
                .range([30, 1000]);

            const depthLiquidityScale = d3
                .scaleLog()
                .domain([
                    depthAskLeft < depthBidLeft ? depthAskLeft : depthBidLeft,
                    depthBidRight > depthAskRight
                        ? depthBidRight
                        : depthAskRight,
                ])
                .range([30, 550]);

            let liqBoundaryDepth = liqBoundary;

            props.liquidityData.ranges.map((data: any) => {
                const liqUpperPrices = denominationsInBase
                    ? data.upperBoundInvPriceDecimalCorrected
                    : data.lowerBoundPriceDecimalCorrected;

                const liqLowerPrices = denominationsInBase
                    ? data.lowerBoundInvPriceDecimalCorrected
                    : data.upperBoundPriceDecimalCorrected;

                if (
                    liqUpperPrices >= liqBoundary &&
                    liqUpperPrices < liqBoundary * 10
                ) {
                    liqBidData.push({
                        activeLiq: liquidityScale(data.activeLiq),
                        liqPrices: liqUpperPrices,
                        deltaAverageUSD: data.deltaAverageUSD
                            ? data.deltaAverageUSD
                            : 0,
                        cumAverageUSD: data.cumAverageUSD
                            ? data.cumAverageUSD
                            : 0,
                        upperBound: data.upperBound,
                        lowerBound: data.lowerBound,
                    });
                } else {
                    if (
                        liqLowerPrices <= limitBoundary &&
                        liqLowerPrices > liqBoundary / 10
                    ) {
                        liqAskData.push({
                            activeLiq: liquidityScale(data.activeLiq),
                            liqPrices: liqLowerPrices,
                            deltaAverageUSD: data.deltaAverageUSD
                                ? data.deltaAverageUSD
                                : 0,
                            cumAverageUSD: data.cumAverageUSD
                                ? data.cumAverageUSD
                                : 0,
                            upperBound: data.upperBound,
                            lowerBound: data.lowerBound,
                        });
                    }
                }

                if (!denominationsInBase) {
                    if (
                        data.cumAskLiq !== undefined &&
                        data.cumAskLiq !== '0' &&
                        liqUpperPrices !== '+inf' &&
                        !Number.isNaN(depthLiquidityScale(data.cumAskLiq)) &&
                        liqUpperPrices < liqBoundary * 10
                    ) {
                        depthLiqBidData.push({
                            activeLiq: depthLiquidityScale(data.cumAskLiq),
                            liqPrices: liqUpperPrices,
                            deltaAverageUSD: data.deltaAverageUSD,
                            cumAverageUSD: data.cumAverageUSD,
                            upperBound: data.upperBound,
                            lowerBound: data.lowerBound,
                        });
                        liqBoundaryDepth = depthLiqBidData[0].liqPrices;
                    }

                    if (
                        data.cumBidLiq !== undefined &&
                        !Number.isNaN(depthLiquidityScale(data.cumBidLiq)) &&
                        liqLowerPrices > liqBoundary / 10
                    ) {
                        depthLiqAskData.push({
                            activeLiq: depthLiquidityScale(data.cumBidLiq),
                            liqPrices: liqLowerPrices,
                            deltaAverageUSD: data.deltaAverageUSD,
                            cumAverageUSD: data.cumAverageUSD,
                            upperBound: data.upperBound,
                            lowerBound: data.lowerBound,
                        });

                        liqBoundaryDepth = liqLowerPrices;
                    }
                } else {
                    if (
                        data.cumBidLiq !== undefined &&
                        data.cumBidLiq !== '0' &&
                        liqUpperPrices !== '+inf' &&
                        liqUpperPrices < liqBoundary * 10 &&
                        !Number.isNaN(depthLiquidityScale(data.cumBidLiq))
                    ) {
                        depthLiqBidData.push({
                            activeLiq: depthLiquidityScale(data.cumBidLiq),
                            liqPrices: liqUpperPrices,
                            deltaAverageUSD: data.deltaAverageUSD,
                            cumAverageUSD: data.cumAverageUSD,
                            upperBound: data.upperBound,
                            lowerBound: data.lowerBound,
                        });
                        liqBoundaryDepth = liqUpperPrices;
                    }

                    if (
                        data.cumAskLiq !== undefined &&
                        data.cumAskLiq !== '0' &&
                        !Number.isNaN(depthLiquidityScale(data.cumAskLiq)) &&
                        liqUpperPrices <= limitBoundary &&
                        liqUpperPrices > liqBoundary / 10
                    ) {
                        depthLiqAskData.push({
                            activeLiq: depthLiquidityScale(data.cumAskLiq),
                            liqPrices: liqLowerPrices,
                            deltaAverageUSD: data.deltaAverageUSD,
                            cumAverageUSD: data.cumAverageUSD,
                            upperBound: data.upperBound,
                            lowerBound: data.lowerBound,
                        });
                        liqBoundaryDepth = depthLiqAskData[0].liqPrices;
                    }
                }
            });
            if (liqBidData.length > 1 && liqAskData.length > 1) {
                liqBidData.sort((a: any, b: any) => b.liqPrices - a.liqPrices);

                liqAskData.sort((a: any, b: any) => b.liqPrices - a.liqPrices);
                depthLiqBidData.sort(
                    (a: any, b: any) => b.liqPrices - a.liqPrices,
                );

                liqBidData.push({
                    activeLiq: liqBidData.find(
                        (liqData) => liqData.liqPrices < limitBoundary,
                    )?.activeLiq,
                    liqPrices: limitBoundary,
                    deltaAverageUSD: 0,
                    cumAverageUSD: 0,
                    upperBound: 0,
                    lowerBound: 0,
                });

                depthLiqBidData.push({
                    activeLiq: depthLiqBidData.find(
                        (liqData) => liqData.liqPrices < limitBoundary,
                    )?.activeLiq,
                    liqPrices: limitBoundary,
                    deltaAverageUSD: 0,
                    cumAverageUSD: 0,
                    upperBound: 0,
                    lowerBound: 0,
                });

                liqAskData.push({
                    activeLiq: liqAskData[liqAskData.length - 1].activeLiq,
                    liqPrices: 0,
                    deltaAverageUSD: 0,
                    cumAverageUSD: 0,
                    upperBound: 0,
                    lowerBound: 0,
                });

                depthLiqAskData.push({
                    activeLiq:
                        depthLiqAskData[
                            !denominationsInBase
                                ? 0
                                : depthLiqAskData.length - 1
                        ]?.activeLiq,
                    liqPrices: 0,
                    deltaAverageUSD: 0,
                    cumAverageUSD: 0,
                    upperBound: 0,
                    lowerBound: 0,
                });
            }
            topBoundary = limitBoundary;
            lowBoundary = parseFloat(rangeBoundary.pinnedMinPriceDisplay);

            liqAskData.sort((a: any, b: any) => b.liqPrices - a.liqPrices);
            liqBidData.sort((a: any, b: any) => b.liqPrices - a.liqPrices);
            depthLiqBidData.sort((a: any, b: any) => b.liqPrices - a.liqPrices);
            depthLiqAskData.sort((a: any, b: any) => b.liqPrices - a.liqPrices);

            return {
                liqAskData: liqAskData,
                liqBidData: liqBidData,
                depthLiqBidData: depthLiqBidData,
                depthLiqAskData: depthLiqAskData,
                liqHighligtedAskSeries: [],
                liqHighligtedBidSeries: [],
                lineBidSeries: [],
                lineAskSeries: [],
                topBoundary: topBoundary,
                lowBoundary: lowBoundary,
                liqBoundaryCurve: liqBoundary,
                liqBoundaryDepth: liqBoundaryDepth,
            };
        } else {
            setIsLoading(true);
            return undefined;
        }
    }, [liqBoundary]);

    useEffect(() => {
        if (!(unparsedCandleData?.length && unparsedCandleData.length > 0)) {
            setScaleData(() => {
                return undefined;
            });
        } else {
            setScaleForChart(unparsedCandleData, true);
        }
    }, [unparsedCandleData?.length && unparsedCandleData.length > 0]);

    useEffect(() => {
        setScaleForChart(unparsedCandleData, false);
    }, [diffHashSig(tokenPair), unparsedCandleData === undefined]);

    // Liq Scale
    useEffect(() => {
        if (liquidityData !== undefined) {
            if (liquidityScale === undefined) {
                setScaleForChartLiquidity(liquidityData);
            }
        } else {
            setLiquidityScale(() => {
                return undefined;
            });
        }
    }, [liquidityData, liquidityScale]);

    const setScaleForChartLiquidity = (liquidityData: any) => {
        IS_LOCAL_ENV && console.debug('parse Liq Scale');
        if (liquidityData !== undefined) {
            const liquidityScale = d3.scaleLinear();
            const liquidityDepthScale = d3.scaleLinear();

            const liquidityExtent = d3fc
                .extentLinear()
                .include([0])
                .accessors([(d: any) => parseFloat(d.activeLiq)]);

            liquidityScale.domain(
                liquidityExtent(
                    liquidityData.liqBidData.concat(liquidityData.liqAskData),
                ),
            );
            liquidityDepthScale.domain(
                liquidityExtent(
                    liquidityData.depthLiqBidData.concat(
                        liquidityData.depthLiqAskData,
                    ),
                ),
            );

            setLiquidityScale(() => liquidityScale);
            setLiquidityDepthScale(() => liquidityDepthScale);
        }
    };

    // Scale
    const setScaleForChart = (
        unparsedCandleData: any,
        isChangeYscale: boolean,
    ) => {
        if (
            unparsedCandleData !== undefined &&
            unparsedCandleData.length > 0 &&
            period
        ) {
            const temp = [...unparsedCandleData];
            const boundaryCandles = temp.splice(0, 99);

            const priceRange = d3fc
                .extentLinear()
                .accessors([
                    (d: any) => {
                        return (
                            denominationsInBase
                                ? d.invMinPriceExclMEVDecimalCorrected
                                : d.maxPriceExclMEVDecimalCorrected,
                            denominationsInBase
                                ? d.invMaxPriceExclMEVDecimalCorrected
                                : d.minPriceExclMEVDecimalCorrected
                        );
                    },
                ])
                .pad([0.05, 0.05]);

            const xExtent = d3fc
                .extentLinear()
                .accessors([(d: any) => d.time * 1000])
                .padUnit('domain')
                .pad([period * 1000, (period / 2) * 80 * 1000]);

            let xScale: any = undefined;
            let xScaleCopy: any = undefined;

            const xScaleTime = d3.scaleTime();
            const yScale = d3.scaleLinear();

            if (isChangeYscale || scaleData === undefined) {
                xScale = d3.scaleLinear();
                xScale.domain(xExtent(boundaryCandles));
                xScaleCopy = xScale.copy();
            } else {
                xScale = scaleData?.xScale;
                xScaleCopy = scaleData?.xScaleCopy;
            }

            yScale.domain(priceRange(boundaryCandles));

            const volumeScale = d3.scaleLinear();

            const yExtentVolume = d3fc
                .extentLinear(candleData?.candles)
                .accessors([(d: any) => d.volumeUSD]);

            volumeScale.domain(yExtentVolume(candleData?.candles));

            setScaleData(() => {
                return {
                    xScale: xScale,
                    xScaleTime: xScaleTime,
                    yScale: yScale,
                    xScaleCopy: xScaleCopy,
                    // ghostScale: ghostScale,
                    volumeScale: volumeScale,
                    lastDragedY: 0,
                    xExtent: xExtent,
                };
            });
        }
    };

    useEffect(() => {
        if (
            unparsedCandleData &&
            unparsedCandleData.length > 0 &&
            period &&
            (prevPeriod === undefined || period !== prevPeriod)
        ) {
            let firtCandleTimeState = unparsedCandleData[0].time;
            if (scaleData && prevPeriod && prevFirsCandle) {
                const domain = scaleData.xScale.domain();

                const direction = domain[1] > prevFirsCandle * 1000 ? -1 : 1;

                const diffDomain = Math.abs(domain[1] - domain[0]);
                const factorDomain = diffDomain / (prevPeriod * 1000);

                const diffCandle = Math.abs(
                    Math.max(domain[1], prevFirsCandle * 1000) -
                        Math.min(domain[1], prevFirsCandle * 1000),
                );
                const factorCanle = diffCandle / (prevPeriod * 1000);

                const newDiffDomain = period * 1000 * factorDomain;
                const newDiffCandle = direction * period * 1000 * factorCanle;

                const firtCandleTime = d3.max(
                    unparsedCandleData,
                    (data: any) => data.time,
                );

                firtCandleTimeState = firtCandleTime;

                const firsShownDomain = firtCandleTime * 1000 - newDiffCandle;

                const lastShownCandle = firsShownDomain - newDiffDomain;

                const fethcingCandles =
                    firsShownDomain > Date.now() ? Date.now() : firsShownDomain;

                scaleData.xScale.domain([lastShownCandle, firsShownDomain]);

                const diffResetLeft = Math.abs(
                    Date.now() - scaleData.xScaleCopy.domain()[0],
                );
                const factorResetLeft = diffResetLeft / (prevPeriod * 1000);
                const newPeriodxScaleCopyFactor =
                    period * 1000 * factorResetLeft;
                const xScaleCopyLeftDomain =
                    Date.now() - newPeriodxScaleCopyFactor;

                const diffResetRight = Math.abs(
                    scaleData.xScaleCopy.domain()[1] - Date.now(),
                );
                const factorResetRigh = diffResetRight / (prevPeriod * 1000);
                const newPeriodxScaleCopyFactorRight =
                    period * 1000 * factorResetRigh;
                const xScaleCopyRightDomain =
                    Date.now() + newPeriodxScaleCopyFactorRight;

                scaleData.xScaleCopy.domain([
                    xScaleCopyLeftDomain,
                    xScaleCopyRightDomain,
                ]);

                const minDate = 1657868400; // 15 July 2022

                const firstTime = Math.floor(fethcingCandles / 1000);

                if (firstTime > minDate && fethcingCandles > lastShownCandle) {
                    const nCandle = Math.floor(
                        (fethcingCandles - lastShownCandle) / (period * 1000),
                    );

                    setCandleScale((prev: candleScale) => {
                        return {
                            isFetchForTimeframe: !prev.isFetchForTimeframe,
                            lastCandleDate: firstTime,
                            nCandle: nCandle,
                        };
                    });
                } else {
                    scaleData.xScale.domain([
                        xScaleCopyLeftDomain,
                        xScaleCopyRightDomain,
                    ]);

                    setCandleScale((prev: candleScale) => {
                        return {
                            isFetchForTimeframe: !prev.isFetchForTimeframe,
                            lastCandleDate: undefined,
                            nCandle: 200,
                        };
                    });
                }
            }

            setPrevFirsCandle(() => firtCandleTimeState);
            setPrevPeriod(() => period);
        }
    }, [period, diffHashSig(unparsedCandleData)]);

    // resetting Chart
    useEffect(() => {
        if (isCandleDataNull && scaleData && scaleData?.xScaleCopy) {
            scaleData.xScale.domain(scaleData?.xScaleCopy.domain());

            setCandleScale((prev: candleScale) => {
                return {
                    isFetchForTimeframe: !prev.isFetchForTimeframe,
                    lastCandleDate: undefined,
                    nCandle: 200,
                };
            });
        }
    }, [isCandleDataNull]);

    const loading = (
        <div
            style={{ height: '100%', width: '100%' }}
            className='animatedImg_container'
        >
            <ChartSkeleton />
            <div className='fetching_text'>Fetching chart data...</div>
        </div>
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            const shouldReload =
                scaleData === undefined ||
                liquidityScale === undefined ||
                liquidityDepthScale === undefined ||
                unparsedCandleData?.length === 0 ||
                poolPriceDisplay === 0 ||
                poolPriceNonDisplay === 0 ||
                liquidityData === undefined;

            if (isLoading !== shouldReload) {
                IS_LOCAL_ENV &&
                    console.debug('setting isLoading to ' + shouldReload);
                setIsLoading(shouldReload);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [
        unparsedCandleData === undefined,
        unparsedCandleData?.length,
        poolPriceDisplay,
        poolPriceNonDisplay,
        scaleData === undefined,
        liquidityScale,
        liquidityDepthScale,
        liquidityData,
        isLoading,
    ]);

    return (
        <>
            <div style={{ height: '100%', width: '100%' }}>
                {!isLoading &&
                candleData !== undefined &&
                prevPeriod === period &&
                candleTimeInSeconds === period &&
                !fetchingCandle ? (
                    <Chart
                        isUserLoggedIn={isUserLoggedIn}
                        chainData={chainData}
                        isTokenABase={isTokenABase}
                        expandTradeTable={expandTradeTable}
                        liquidityData={liquidityData}
                        changeState={props.changeState}
                        limitTick={props.limitTick}
                        denomInBase={denominationsInBase}
                        isAdvancedModeActive={props.isAdvancedModeActive}
                        rangeSimpleRangeWidth={props.simpleRangeWidth}
                        poolPriceDisplay={props.poolPriceDisplay}
                        truncatedPoolPrice={props.truncatedPoolPrice}
                        chartItemStates={props.chartItemStates}
                        setCurrentData={props.setCurrentData}
                        setCurrentVolumeData={props.setCurrentVolumeData}
                        upBodyColor={props.upBodyColor}
                        upBorderColor={props.upBorderColor}
                        downBodyColor={props.downBodyColor}
                        downBorderColor={props.downBorderColor}
                        upVolumeColor={props.upVolumeColor}
                        downVolumeColor={props.downVolumeColor}
                        isCandleAdded={isCandleAdded}
                        setIsCandleAdded={setIsCandleAdded}
                        scaleData={scaleData}
                        chainId={chainId}
                        prevPeriod={prevPeriod}
                        candleTimeInSeconds={candleTimeInSeconds}
                        poolPriceNonDisplay={poolPriceNonDisplay}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        rescale={props.rescale}
                        setRescale={props.setRescale}
                        latest={props.latest}
                        setLatest={props.setLatest}
                        reset={props.reset}
                        setReset={props.setReset}
                        showLatest={props.showLatest}
                        setShowLatest={props.setShowLatest}
                        setShowTooltip={props.setShowTooltip}
                        liquidityScale={liquidityScale}
                        liquidityDepthScale={liquidityDepthScale}
                        handlePulseAnimation={handlePulseAnimation}
                        minPrice={rangeState.minRangePrice}
                        maxPrice={rangeState.maxRangePrice}
                        setMaxPrice={rangeState.setMaxRangePrice}
                        setMinPrice={rangeState.setMinRangePrice}
                        rescaleRangeBoundariesWithSlider={
                            rangeState.rescaleRangeBoundariesWithSlider
                        }
                        setRescaleRangeBoundariesWithSlider={
                            rangeState.setRescaleRangeBoundariesWithSlider
                        }
                        setRangeSimpleRangeWidth={setSimpleRangeWidth}
                        setRepositionRangeWidth={setRepositionRangeWidth}
                        repositionRangeWidth={repositionRangeWidth}
                        setChartTriggeredBy={rangeState.setChartTriggeredBy}
                        chartTriggeredBy={rangeState.chartTriggeredBy}
                        candleTime={
                            isMarketOrLimitModule
                                ? chartSettings.candleTime.market
                                : chartSettings.candleTime.range
                        }
                        unparsedData={candleData}
                    />
                ) : (
                    <>{loading}</>
                )}
            </div>
        </>
    );
}

export default memo(TradeCandleStickChart);
