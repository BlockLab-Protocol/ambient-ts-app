import React, { useEffect, useState } from 'react';
import styles from './Toolbar.module.css';
import drawLine from '../../../../assets/images/icons/draw/draw_line.svg';
import drawCross from '../../../../assets/images/icons/draw/draw_cross.svg';
import drawRect from '../../../../assets/images/icons/draw/rect.svg';

interface ToolbarProps {
    isDrawActive: boolean;
    setIsDrawActive: React.Dispatch<React.SetStateAction<boolean>>;
    activeDrawingType: string;
    setActiveDrawingType: React.Dispatch<React.SetStateAction<string>>;
    isToolbarOpen: boolean;
    setIsToolbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function Toolbar(props: ToolbarProps) {
    const {
        isDrawActive,
        setIsDrawActive,
        activeDrawingType,
        setActiveDrawingType,
        isToolbarOpen,
        setIsToolbarOpen,
    } = props;

    useEffect(() => {
        const feeRate = document.getElementById('fee_rate_chart');
        const tvl = document.getElementById('tvl_chart');
        if (feeRate && tvl) {
            const toolbar = document.getElementById('toolbar_container');

            const column = toolbar ? toolbar.getClientRects()[0].width : 9;

            feeRate.style.gridTemplateColumns =
                column + 'px auto 1fr auto minmax(1em, max-content)';
            tvl.style.gridTemplateColumns =
                column + 'px auto 1fr auto minmax(1em, max-content)';
        }
    }, [isToolbarOpen]);

    function handleDrawModeChange(item: any) {
        if (item.label === 'Cross') return;

        setIsDrawActive((prev: boolean) => !prev);
        setActiveDrawingType(item.label);
    }

    const iconList = [
        {
            icon: drawCross,
            label: 'Cross',
        },
        {
            icon: drawLine,
            label: 'Brush',
        },
        {
            icon: drawRect,
            label: 'Square',
        },

        // Add more icons here
    ];

    return (
        <div className={styles.toolbar_container} id='toolbar_container'>
            {isToolbarOpen ? (
                <div className={styles.drawlist_cotainer}>
                    <div>
                        {iconList.map((item, index) => (
                            <div key={index} className={styles.icon_card}>
                                <div
                                    className={
                                        isDrawActive
                                            ? styles.icon_active_container
                                            : styles.icon_inactive_container
                                    }
                                    onClick={() => handleDrawModeChange(item)}
                                >
                                    <img
                                        className={
                                            (activeDrawingType === 'Cross' &&
                                                item.label === 'Cross') ||
                                            (isDrawActive &&
                                                activeDrawingType ===
                                                    item.label)
                                                ? styles.icon_active
                                                : styles.icon_inactive
                                        }
                                        src={item.icon}
                                        alt=''
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.divider_container}>
                        <div className={styles.divider}></div>
                        <div
                            className={styles.divider_button}
                            onClick={() =>
                                setIsToolbarOpen((prev: boolean) => !prev)
                            }
                        >
                            <span className={styles.arrow_left}></span>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className={styles.close_divider_container}
                    onClick={() => setIsToolbarOpen((prev: boolean) => !prev)}
                >
                    <div className={styles.divider}></div>
                    <div className={styles.close_divider_button}>
                        <span className={styles.arrow_right}></span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Toolbar;
