import SnackbarComponent from '../../components/Global/SnackbarComponent/SnackbarComponent';
import { useState } from 'react';
import TooltipComponent from '../../components/Global/TooltipComponent/TooltipComponent';
import PoolCard from '../../components/Global/PoolCard/PoolCard';
import Stats from '../../components/Home/Stats/AmbientStats';
import Carousel from '../../components/Global/Carousel/Carousel';
import CarouselItem from '../../components/Global/Carousel/CarouselItem/CarouselItem';
import Landing2 from '../../components/Home/Landing/Landing2';
import Landing from '../../components/Home/Landing/Landing';
import Landing3 from '../../components/Home/Landing/Landing3';
import Landing4 from '../../components/Home/Landing/Landing4';
import Landing5 from '../../components/Home/Landing/Landing5';
import Landing6 from '../../components/Home/Landing/Landing6';

export default function TestPage() {
    const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);

    return (
        <main>
            <button onClick={() => setOpenSnackbar(true)}>open me</button>
            <h3>This is TestPage.tsx</h3>
            <SnackbarComponent
                severity='success'
                setOpenSnackbar={setOpenSnackbar}
                openSnackbar={openSnackbar}
            >
                I am snackbar
            </SnackbarComponent>
            <TooltipComponent title='Snackbar title' />
            <PoolCard />
            <Stats />
            <Carousel>
                <CarouselItem>
                    <Landing />
                </CarouselItem>
                <CarouselItem>
                    <Landing2 />
                </CarouselItem>
                <CarouselItem>
                    <Landing3 />
                </CarouselItem>
                <CarouselItem>
                    <Landing4 />
                </CarouselItem>
                <CarouselItem>
                    <Landing5 />
                </CarouselItem>
                <CarouselItem>
                    <Landing6 />
                </CarouselItem>
            </Carousel>
            {/* <Landing />
            <Landing2 />
            <Landing3 />
            <Landing4 />
            <Landing5 />
            <Landing6 /> */}
        </main>
    );
}
