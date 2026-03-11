'use client';

import { motion } from 'framer-motion';

export const CashFlowAnimation = () => {
    // Array of distinct bill movements
    const bills = [
        { x: -20, y: -40, rotate: -15, delay: 0 },
        { x: 0, y: -60, rotate: 0, delay: 0.1 },
        { x: 20, y: -40, rotate: 15, delay: 0.2 },
        { x: -10, y: -80, rotate: -10, delay: 0.3 },
        { x: 10, y: -80, rotate: 10, delay: 0.4 },
    ];

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
            {bills.map((bill, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 0, x: 0, scale: 0.5, rotate: 0 }}
                    whileHover={{
                        opacity: [0, 1, 0],
                        y: bill.y,
                        x: bill.x,
                        scale: 1,
                        rotate: bill.rotate
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: bill.delay,
                        ease: "easeOut",
                        repeatDelay: 0.5
                    }}
                    variants={{
                        hover: {
                            opacity: [0, 1, 0],
                            y: bill.y,
                            x: bill.x,
                            scale: 1,
                            rotate: bill.rotate,
                            transition: {
                                duration: 1.2,
                                repeat: Infinity,
                                delay: bill.delay,
                                ease: "easeOut"
                            }
                        },
                        initial: { opacity: 0, y: 0 }
                    }}
                    className="absolute text-green-500 font-bold text-2xl z-20"
                >
                    💸
                </motion.div>
            ))}
        </div>
    );
};
