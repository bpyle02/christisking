import { Link } from 'react-router-dom';
import logo from '../images/icon2.png'
import AnimationWrapper from '../common/page-animation';
import defaultHeader from '../images/blog banner.png';
import { useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';

const PostEditor = () => {

    let postBannerRef = useRef()

    async function uploadImage(image) {
        const formData = new FormData();
        formData.append('image', image);
        
        try {
            const response = await fetch('http://localhost:3000/upload', {
                method: 'POST',
                body: formData
            });
            console.log(response)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.imageId) {
                console.log("IMAGE ID: ", data.imageId)
                return data
            }
            return null
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    }


    const handleHeaderUpload = async (e) => {
        let image = e.target.files[0];
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        
        if (image) {

            let loadingToast = toast.loading("Uploading...")

            if (image.size > maxSize) {
                toast.dismiss()
                return toast.error("File size exceeds 2MB. Please select a smaller image.")
            }
            
            try {
                const data = await uploadImage(image);
                if (data && data.imageId) {
                    const imageUrl = await fetchImage(data.imageId);
                    if (imageUrl) {
                        postBannerRef.current.src = imageUrl;
                    }
                }
            } catch (error) {
                return toast.error('Error in image upload or fetch: ', error);
            }

            toast.dismiss()
        }
    };
    
    // New function to fetch the image from the server
    const fetchImage = async (imageId) => {
        try {
            const response = await fetch(`http://localhost:3000/image/${imageId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error fetching image:', error);
            return null;
        }
    }

    const handleTitleKeyDown = (e) => {
        if (e.keyCode == 13) {
            e.preventDefault();
        }
    }

    const handleTitleChange = (e) => {
        let input = e.target;

        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px'
    }

    return (
        <>
            <nav className="navbar">
                <Link to="/">
                    <img src={logo} className='flex-none w-20' />
                </Link> 
            
                <p className='max-md:hidden text-black line-clamp-1 w-full'>New Post</p>
            
                <div className='flex gap-4 ml-auto'>
                    <button className='btn-dark'>Publish</button>
                    <button className='btn-light'>Save Draft</button>
                </div>
            </nav>

            <AnimationWrapper>
                <Toaster />
                <section>
                    <div className='mx-auto max-w-[900px] w-full'>
                        <div className='relative aspect-video bg-white border-4 border-grey hover:opacity-80'>
                            <label htmlFor='uploadBanner' className='cursor-pointer'>
                                <img ref={postBannerRef} src={defaultHeader} className='z-20' />
                                <input
                                    id="uploadBanner"
                                    type="file"
                                    accept='.png,.jpg,.jpeg'
                                    hidden
                                    onChange={handleHeaderUpload}
                                />
                            </label>
                        </div>

                        <textarea
                            placeholder='Post Title'
                            className='text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40'
                            onKeyDown={handleTitleKeyDown}
                            onChange={handleTitleChange}
                        >

                        </textarea>

                    </div>
                </section>
            </AnimationWrapper>

        </>
    )
}

export default PostEditor;