// START: Import React and Dongles
import { useCallback, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import FocusTrap from 'focus-trap-react';

// START: Import Local Files
import styles from './SimpleModal.module.css';
import SimpleModalHeader from './SimpleModalHeader/SimpleModalHeader';

// interface for React functional component
interface SimpleModalPropsIF {
    noBackground?: boolean;
    onClose: () => void;
    handleBack?: () => void;

    children: ReactNode;

    title?: string;
}

// React functional component
export default function SimpleModal(props: SimpleModalPropsIF) {
    const { onClose, title, children, noBackground } = props;

    const escFunction = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', escFunction, false);
        return () => {
            document.removeEventListener('keydown', escFunction, false);
        };
    }, []);

    return (
        <aside
            className={styles.outside_modal}
            onMouseDown={onClose}
            // tabIndex={-1}
            role='dialog'
            aria-modal='true'
        >
            <FocusTrap>
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`
                ${styles.modal_body}
                ${noBackground ? styles.no_background_modal : null}
                `}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{ justifyContent: 'flex-start' }}
                >
                    <section className={styles.modal_content}>
                        {title && (
                            <SimpleModalHeader
                                title={title}
                                onClose={onClose}
                            />
                        )}
                        {children}
                    </section>
                </motion.div>
            </FocusTrap>
        </aside>
    );
}
