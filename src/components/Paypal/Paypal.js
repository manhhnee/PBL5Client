import React, { useEffect, useState } from 'react';
import { PayPalButton } from 'react-paypal-button-v2';
import { Flip, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

import * as PaymentService from '../../services/PaymentService';

const Paypal = ({ idBookSupplier, quantity, price, amount, address }) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [clientId, setClientId] = useState('');
  const [loggedIn, setLoggedIn] = useState(!!getJwtFromCookie());

  const addPaypalScript = async () => {
    const { data } = await PaymentService.getConfig();
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://www.paypal.com/sdk/js?client-id=${data}`;
    script.async = true;
    script.onload = () => {
      setSdkReady(true);
    };
    document.body.appendChild(script);
    setClientId(data);
  };

  function getJwtFromCookie() {
    const name = 'token=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return '';
  }

  const handleCreateOneOrder = async (id_BookSupplier, quantity, Price, Amount, address) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/order/addOneItem',
        {
          payment: 2,
          id_BookSupplier: id_BookSupplier,
          quantity: quantity,
          Price: Price,
          Amount: Amount,
          address: address,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getJwtFromCookie()}`,
          },
        },
      );

      toast.success(response.data.message);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (!window.paypal) {
      addPaypalScript();
    } else {
      setSdkReady(true);
    }
  }, []);

  useEffect(() => {
    setLoggedIn(!!getJwtFromCookie());
  }, []);

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        transition={Flip}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {address.trim() && loggedIn && sdkReady && (
        <PayPalButton
          amount={price}
          onSuccess={(details, data) => {
            handleCreateOneOrder(idBookSupplier, quantity, (price * 24000).toFixed(2), amount, address);
            return fetch('/paypal-transaction-complete', {
              method: 'post',
              body: JSON.stringify({
                orderID: data.orderID,
              }),
            });
          }}
          onError={() => alert('Error')}
        />
      )}
    </div>
  );
};

export default Paypal;
