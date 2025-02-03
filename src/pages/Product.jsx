import React from 'react';
import { useState,Fragment, useEffect } from 'react';
import { RadioGroup, Tab } from '@headlessui/react';
import { CheckIcon, ShoppingCartIcon, TrashIcon } from '@heroicons/react/20/solid'
import Navbar from '../components/Navbar';
import CategoryBanner from '../components/CategoryBanner';
import { firestore } from '../firebase/FirebaseConfig';
import { doc,documentId, getDoc,query,where,collection, getDocs, addDoc, arrayUnion, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { cartTotalAtom } from '../store/atoms/totalCartQuantity';
const Product = (props) => {

  const [product, setProduct] = useState();
  const [prices,setPrices] = useState([[]]);
  const [activeImage, setActiveImage] = useState();
  const [variations, setVariations] = useState([]);
  const [selectedVariant, setSelectedVariant ] = useState();
  const [quantity, setQuantity] = useState(0);
  const [total, setTotal] = useState(0);
  const [pricePerPiece, setPricePerPiece] = useState(0);
  const [cartTotal, setCartTotal] = useRecoilState(cartTotalAtom);

  const { id } = useParams();

  useEffect(() => {
        getProductDetails();
    },[])

const getProductDetails = async() => {
    const productRef = doc(firestore, 'products', id);
    const prod = await getDoc(productRef);
    setProduct(prod.data());
    setActiveImage(prod.data().image);
    getVariationData();
}

const getPricesData = async(variationId) => {
        const docRef = collection(firestore, "products", id, "variations", variationId, "prices");
        const docSnap = await getDocs(docRef);
        let pricesArray = [];
        let i=0;
        docSnap.forEach((doc) => {
            if (!pricesArray[i]) {
                pricesArray[i] = [];
            }
                pricesArray[i][0] = doc.data().minQuantity;
                pricesArray[i][1] = doc.data().maxQuantity;
                pricesArray[i][2] = doc.data().price;
                i++;
        })
        setPrices(pricesArray);
    }
const getVariationData = async() => {
        const docRef = collection(firestore, "products",id,"variations");
        const docSnap = await getDocs(docRef);
        const newData = docSnap.docs.map(doc => ({ variationId: doc.id, ...doc.data() }));

            setVariations(newData);
            setSelectedVariant(newData[0]);
            getQuantity(newData[0].variationId);
            getPricesData(newData[0].variationId)
    }

const getQuantity = async(variationid) => {
        const cartRef = collection(firestore, 'carts');
            const q = query(cartRef, where("userId", "==", localStorage.getItem('userId')));
            const querySnapshot = await getDocs(q);
            const currdoc = querySnapshot.docs[0];
            const itemsCollection = collection(firestore,"carts",currdoc.id,"items");
            const itemq = query(itemsCollection,where("productId","==",id),where("variantId","==",variationid))
            const docSnap = await getDocs(itemq);
            if(docSnap.docs[0]){
            setQuantity(docSnap.docs[0].data().quantity);}
            else{
                setQuantity(0);
            }


    }

    const handleVariantChange = (v) => {
    // Example: Update price based on the selected variant
        let i = -1;
        for(let j =0;j< variations.length ;j++){
        if(variations[j].name === v){
            i=j;
            break;
        }
        }
        setSelectedVariant(variations[i]);
        getQuantity(variations[i].variationId);
    };

    const getCartTotal = async() => {
        const q = query(collection(firestore, "carts"), where("userId", "==",localStorage.getItem("userId")));
        const querySnapshot = await getDocs(q);
        if(!querySnapshot.empty){
                const currdoc = querySnapshot.docs[0];
                const existingItemsCollection = collection(firestore, 'carts', currdoc.id, "items");
                const docSnap = await getDocs(existingItemsCollection);
                let allItems =[];
                if(!docSnap.empty){
                    docSnap.forEach((doc) => {
                    allItems.push({id: doc.id ,...doc.data()});
                    })
                    setCartTotal(allItems.reduce((total, currentItem) => {return total + parseInt(currentItem.quantity)},0))
                    
                }
        }

    }

const addToCart = async() => {
        try {
        const cartRef = collection(firestore, 'carts');
        if(localStorage.getItem('userId')){
            const q = query(cartRef, where("userId", "==", localStorage.getItem('userId')));
            const querySnapshot = await getDocs(q);
            if(querySnapshot.empty){
                const docRef = await addDoc(cartRef,{
                    userId : localStorage.getItem('userId')
                })

                const itemsCollection = collection(firestore,"carts",docRef.id,"items");
                const itemRef = await addDoc(itemsCollection, {
                    productId : id,
                    variantId : selectedVariant.variationId,
                    quantity: quantity,
                    productImage : product.image,
                    productTitle : product.title,
                    pricePerPiece : pricePerPiece,
                    variantName : selectedVariant.name,
                    productBrand : product.brand

                })

            }
            else {
                
                const currdoc = querySnapshot.docs[0];
                
                const existingItemsCollection = collection(firestore, 'carts', currdoc.id, "items");
                const itemQuery = query(existingItemsCollection, where("productId", "==", id), where("variantId" ,"==", selectedVariant.variationId));
                const itemDoc = await getDocs(itemQuery);
                if(!itemDoc.empty){
                    itemDoc.forEach(async(idoc) => {
                        const itemRef = doc(firestore,"carts", currdoc.id,"items",idoc.id);
                        await updateDoc(itemRef, {
                            pricePerPiece : pricePerPiece,
                            quantity : quantity

                        })
                    });
                }else{
                const itemRef = await addDoc(existingItemsCollection, {
                            productId : id,
                            variantId : selectedVariant.variationId,
                            quantity: quantity,
                            productImage : product.image,
                            productTitle : product.title,
                            pricePerPiece: pricePerPiece,
                            variantName : selectedVariant.name,
                            productBrand : product.brand

                        })
                } 
            }
                getCartTotal();
        
        }else {
            alert("Sign in first");
            return;
        }
        }catch(err){
            console.error(err)
        }
    }

    const deleteCartItem = async() => {
        try {
        const cartRef = collection(firestore, 'carts');
            const q = query(cartRef, where("userId", "==", localStorage.getItem('userId')));
            const querySnapshot = await getDocs(q);
            const currdoc = querySnapshot.docs[0];
            const itemsCollection = collection(firestore,"carts",currdoc.id,"items");
            const itemq = query(itemsCollection,where("productId","==",id),where("variantId","==",selectedVariant.variationId))
            const itemDoc = await getDocs(itemq);
            const docDel = doc(firestore,"carts", currdoc.id, "items", itemDoc.docs[0].id)
                await deleteDoc(docDel)
                setCartTotal(cartTotal-quantity);
                setQuantity(0);
        }catch(err){
            console.error(err)
        }

    }

    const handleFocus = (event) => {
        // Clear the input if the initial value is 0 when it's focused
        if (quantity === 0) {
        event.target.value = '';
        }
    };

    const handleBlur = (event) => {
        // Set the input value to 0 if it's empty when blurred
        if (event.target.value === '') {
        setQuantity(0);
        }
    };

    const handleQuantityChange = (e) => {
        const inputValue = e.target.value === '' ? 0 : parseInt(e.target.value,10);
        setQuantity(inputValue);
        for(let i=0;i<prices.length;i++){
            if(inputValue>=prices[i][0] && inputValue <= prices[i][1]){
              
                setPricePerPiece(prices[i][2]);
                setTotal(inputValue*prices[i][2])
            }
        }
    }

      const increaseQuantity = () => {
        const newQuantity = quantity+1;
        setQuantity(newQuantity);
        for(let i=0;i<prices.length;i++){
            if(newQuantity>=prices[i][0] && newQuantity <= prices[i][1]){
                setPricePerPiece(prices[i][2]);
                setTotal(newQuantity*prices[i][2])
            }
        }
        
    }

    const decreaseQuantity = () => {
        const newQuantity = quantity-1;
        setQuantity(newQuantity);
        for(let i=0;i<prices.length;i++){
            if(newQuantity>=prices[i][0] && newQuantity <= prices[i][1]){
                setPricePerPiece(prices[i][2]);
                setTotal(newQuantity*prices[i][2])
            }
        }
        
    }

  function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}


  return (
    <div className='pt-20'>
      <Navbar />
      {product && <>
        <div className="mt-24">
      {/* <!-- Breadcrumbs --> */}
        {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <a href="#" className="hover:underline hover:text-gray-600">Drink</a>
            <span>
              <svg className="h-5 w-5 leading-none text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
            <a href="#" className="hover:underline hover:text-gray-600">Coffee</a>
          </div>
        </div> */}
  {/* <!-- ./ Breadcrumbs --> */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row -mx-4">
            <div className="md:flex-1 px-4">
              <div x-data="{ image: 1 }">
                <div className="h-64 md:h-80 rounded-lg bg-gray-100 mb-4">
                  <div className="h-64 md:h-80 rounded-lg bg-gray-100 mb-4 flex items-center justify-center">
                    <img className=" border border-gray-400 object-contain w-full h-full" src={activeImage} />
                  </div>
                  </div>

                <div className="flex -mx-2 mb-4 gap-2">
                  {product.image.map((img,idx) => (
              <div key={idx} className="flex-1 px-2">
                <button
                  onClick={() => setActiveImage(img)}
                  className={`focus:outline-none rounded-lg h-24 md:h-32 bg-gray-100 flex items-center justify-center ${
                    activeImage === img ? 'ring-2 ring-indigo-300 ring-inset' : ''
                  }`}
                >
                  <img className="border border-gray-400 object-cover w-full h-full" src={img} />
                </button>
              </div>
            ))}
                </div>
              </div>
            </div>
            {selectedVariant &&
            <div className="md:flex-1 px-4">
              <h2 className="mb-2 leading-tight tracking-tight font-bold text-gray-800 text-2xl md:text-3xl">{product.title}: <span className='text-md font-normal'>{selectedVariant.name}</span></h2>
              <p className="text-gray-500 text-sm">By <a href="#" className="text-indigo-600 hover:underline">{product.brand}</a></p>

              <RadioGroup value={selectedVariant} onChange={handleVariantChange} className="py-8 border-b">
                    <RadioGroup.Label>Variant</RadioGroup.Label>
                    <div className='flex gap-2'>
                    {variations.map((variation) => (
                      <RadioGroup.Option
                        key={variation.name}
                        value={variation.name}
                        data-headlessui-state={selectedVariant.name === variation.name ? 'active checked': ""}
                        className="mt-4 border rounded-md border-gray-400 w-28 p-4 text-center ui-active:border-blue-400 ui-active:bg-white ui-not-active:bg-gray-200"
                      >
                        {variation.name}
                      </RadioGroup.Option>
                    ))}
                    </div>
              </RadioGroup>


              <div className="flex flex-col pt-4 pb-8 space-y-12 border-b">
              {/* <div className='flex gap-12'>
                  <p className='flex flex-col text-2xl h-10'><span className='text-gray-500'>1-10</span> <span>₹{selectedVariant.price}</span></p>
                  <p className='flex flex-col text-2xl h-10'><span className='text-gray-500'>11-50</span> <span>₹280</span></p>
                  <p className='flex flex-col text-2xl h-10'><span className='text-gray-500'> &gt;=51</span> <span>₹{260}</span></p>
              </div> */}
                <div className='hidden sm:flex mt-2 w-full flex justify-between items-center'>
                    <div className="flex items-center border-gray-100">
                        <button className={`${quantity>0 ? "bg-blue-500 hover:bg-blue-300": "bg-gray-200"} text-white cursor-pointer rounded-l py-1 px-3.5 duration-100 `} disabled={quantity<1?true:false} onClick={decreaseQuantity}> - </button>
                        <input className="h-8 w-14 border bg-white text-center text-black text-xs outline-none py-2" type='number' value={quantity} onChange={handleQuantityChange} onFocus={handleFocus} onBlur={handleBlur} />
                        <button className={`bg-blue-500 hover:bg-blue-300 h-8 text-white text-xl rounded-r  px-3 duration-100`} onClick={increaseQuantity}> + </button>
                    </div>
                    <h2 className=' text-xs flex flex-col gap-1'><span className='text-gray-500 font-bold'>Rs/pc</span><span className='text-black'>{pricePerPiece}</span></h2>
                    <h2 className=' text-xs flex flex-col gap-1'><span className='text-gray-500 font-bold'>Total</span><span className='text-black'>{total}</span></h2>
                </div>
                <button className='hidden sm:flex mt-2 w-full rounded-md flex gap-2 py-2 justify-center items-center bg-blue-500 hover:bg-blue-400' onClick={addToCart}>
                <ShoppingCartIcon className='w-auto h-5 text-white' />
                <span className='text-white font-medium text-sm'>Add To Cart </span>
                </button>
              
              </div>
            </div>
            }
          </div>
          <div className="w-full px-2 py-16 sm:px-0">
                <h1 className='text-2xl underline mb-4'>Description</h1>
                <p className='text-lg font-normal'>{product.description}</p>
          </div>
        </div>
      </div>
      </>}
      
    </div>
  )
}

export default Product

