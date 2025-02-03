import { collection, getDocs, query, where } from 'firebase/firestore';
import React, {useEffect, useState} from 'react';
import { useSearchParams } from 'react-router-dom';
import { firestore } from '../firebase/FirebaseConfig';
import Item from '../components/Item';
import Navbar from '../components/Navbar';
import FooterComponent from '../components/FooterComponent';

const Search = () => {

  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();
  const searchItem = searchParams.get("searchItem");

  useEffect(() => {
    handleSearch();
  },[searchParams])

  const handleSearch = async () => {
  try {
      const productsRef = collection(firestore, 'products');
      const searchTerms = searchItem.toLowerCase().split(' ').filter(term => term.trim() !== '');
      let finalResults = [];

      for (const term of searchTerms) {
        const q = query(productsRef, where('tags', 'array-contains', term));
        const querySnapshot = await getDocs(q)
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        finalResults = finalResults.concat(results);
      }

      // Filter out duplicates
      const uniqueResults = Array.from(new Set(finalResults.map(result => result.id)))
        .map(id => finalResults.find(result => result.id === id));

      setProducts(uniqueResults);
    } catch (error) {
      console.error('Error searching for products:', error);
    }
};


  return (
    <div className='min-h-screen flex flex-col justify-between'>
      <Navbar />
      <div className='md:mx-12 lg:mx-24 mt-32 md:mt-[120px]'>
        <h1 className='ml-8 flex gap-4'><p className='text-black font-medium text-sm md:text-3xl'>Search results</p> <span className='text-gray-400 font-normal text-sm md:text-lg flex items-end'>Showing {products.length} results for "{searchItem}"</span></h1>
        <section className=" w-full px-2 auto-cols-auto xl:pr-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center justify-center gap-y-10 sm:gap-y-20 gap-x-4 mt-10 mb-5">
                  {products.map((item,index) => (
                        <Item key={index} title={item.title} image={item.image} brand={item.brand} product={item.product} price={item.price} discounted_price={item.discounted_price} id={item.id} variationId={item.variationId} />
                    ))}
      </section>
    </div>
    <FooterComponent />
    </div>
  )
}

export default Search
Search