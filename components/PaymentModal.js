import { useEffect, useRef, useState } from 'react';
import styles from '../styles/PaymentModal.module.css';

const clientKey = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm'; // Toss Payments Payment Widget Test Client Key
const customerKey = 'test_customer_key_' + Math.random().toString(36).substring(2, 15); // Random customer key for testing

export default function PaymentModal({ isOpen, onClose, amount, orderId, orderName, customerName, customerEmail, customerMobilePhone, products, customerInfo }) {
    const [paymentWidget, setPaymentWidget] = useState(null);
    const widgetRef = useRef(null);
    const [price, setPrice] = useState(amount);

    useEffect(() => {
        if (isOpen && amount > 0) {
            setPrice(amount);
        }
    }, [isOpen, amount]);

    useEffect(() => {
        if (!isOpen || widgetRef.current) return;

        const fetchPaymentWidget = async () => {
            if (!window.TossPayments) {
                console.log("TossPayments SDK not loaded yet, retrying...");
                setTimeout(fetchPaymentWidget, 500);
                return;
            }

            try {
                // V2 Initialization
                const tossPayments = window.TossPayments(clientKey);
                const widgets = tossPayments.widgets({ customerKey });
                setPaymentWidget(widgets);
                widgetRef.current = widgets;
            } catch (error) {
                console.error("Error loading payment widget:", error);
            }
        };

        fetchPaymentWidget();
    }, [isOpen]);

    // Cleanup when modal closes
    useEffect(() => {
        if (!isOpen) {
            // Reset widget state when modal closes
            setPaymentWidget(null);
            widgetRef.current = null;

            // Clear widget containers
            const paymentMethod = document.getElementById('payment-method');
            const agreement = document.getElementById('agreement');
            if (paymentMethod) paymentMethod.innerHTML = '';
            if (agreement) agreement.innerHTML = '';
        }
    }, [isOpen]);

    useEffect(() => {
        if (paymentWidget == null) {
            return;
        }

        const renderWidgets = async () => {
            try {
                // V2 Render
                await paymentWidget.setAmount({
                    currency: "KRW",
                    value: price
                });

                await paymentWidget.renderPaymentMethods({
                    selector: "#payment-method",
                    variantKey: "DEFAULT"
                });

                await paymentWidget.renderAgreement({
                    selector: "#agreement",
                    variantKey: "AGREEMENT"
                });
            } catch (error) {
                console.error("Error rendering widgets:", error);
            }
        };

        renderWidgets();
    }, [paymentWidget, price]);

    const handlePaymentRequest = async () => {
        if (!paymentWidget) {
            console.error("Payment widget is not loaded yet.");
            return;
        }

        // Save order details to localStorage for processing in success page
        localStorage.setItem('tempOrder', JSON.stringify({
            orderId,
            amount,
            products,
            customerInfo
        }));
        console.log("Order details saved to localStorage.");

        try {
            console.log('Requesting payment with:', { orderId, orderName, amount: price });

            await paymentWidget.requestPayment({
                orderId: orderId,
                orderName: orderName,
                customerName: customerName || '익명',
                customerEmail: customerEmail || 'test@example.com',
                customerMobilePhone: customerMobilePhone || '01000000000',
                successUrl: `${window.location.origin}/success`,
                failUrl: `${window.location.origin}/fail`,
            });

            console.log("Payment request initiated successfully");
        } catch (error) {
            console.error("Payment request failed:", error);
            alert(`결제 요청 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h2 className={styles.title}>결제하기</h2>

                {/* Payment Widget Container */}
                <div id="payment-method" />
                <div id="agreement" />

                <button
                    className={styles.payButton}
                    onClick={handlePaymentRequest}
                    disabled={!paymentWidget}
                >
                    {paymentWidget ? `${price.toLocaleString()}원 결제하기` : '결제 모듈 로딩 중...'}
                </button>
            </div>
        </div>
    );
}
