import React from 'react'
import './homepage.css'
import imgc1 from '../assets/carousel_1.png'
import imgc2 from '../assets/carousel_2.png'
import imgc3 from '../assets/carousel_3.png'
import video from '../assets/video.mp4'

const HomePage = () => {
  return (
   <>
   <main>

<div class="welcome">
    <p>Welcome</p>
</div>

<div class="content">
    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae debitis ea libero ipsa sunt laborum
        iste qui quos, quam saepe aperiam, commodi non possimus pariatur illum quas in voluptatum ipsam incidunt
        eaque facilis beatae. Dolor dolorem cupiditate, nemo reiciendis laudantium enim ipsa numquam ad quas
        iste rem tempore eligendi unde deleniti pariatur similique, mollitia quae adipisci suscipit saepe
        voluptatem? Veniam perspiciatis ullam perferendis ducimus quaerat nesciunt qui tenetur hic ex cumque
        recusandae eius nemo modi nam quam sapiente ab id aliquid, minus incidunt ratione esse doloribus non
        vel. Corrupti quas similique excepturi, nihil commodi deserunt deleniti natus aliquid veniam facere
        tempora quaerat architecto doloribus? Est dolores hic tempore dignissimos nisi eveniet, sed velit
        consequuntur, esse illum sit repudiandae. Numquam, dolore! Quis, veritatis. Velit amet eveniet quo quam
        atque hic modi, ab debitis deserunt, temporibus numquam commodi labore impedit omnis voluptates autem.
        Nulla ea doloribus magnam, quibusdam ullam omnis unde dolor voluptatibus a itaque consectetur deleniti
        officiis impedit expedita corporis perspiciatis veritatis animi, tempore beatae natus quis modi commodi
        voluptatem. Mollitia porro, ratione inventore eius voluptatum dolores, totam sapiente magni, odit nobis
        deserunt eligendi. Veritatis, debitis dolores labore, saepe quibusdam ipsum reprehenderit harum
        inventore quo reiciendis eos necessitatibus voluptas delectus. Enim eum animi recusandae aliquam sequi.
        Laboriosam, aliquam quia voluptas, et velit quod deleniti error ducimus ratione assumenda consectetur
        totam, quo asperiores molestiae voluptatibus dolorem dicta? Voluptas architecto nemo culpa sed corrupti
        magnam in nulla, placeat accusantium, incidunt officiis. Consequuntur id quas itaque asperiores, autem
        reiciendis iure velit, omnis, quisquam illum doloribus quia adipisci? Exercitationem laudantium aliquam,
        non amet repellendus nobis aliquid culpa explicabo ut quam voluptatibus dolores autem alias, quo libero
        consequatur suscipit possimus praesentium delectus a! Sit voluptatem, nulla perspiciatis qui, vitae
        repudiandae tempore autem optio libero distinctio nam ducimus aperiam nesciunt possimus eos sapiente
        totam? Quaerat, beatae aut?</p>
</div>

<div class="carousel-container">
    <div class="carousel">
        <div class="carousel-item"><img src={imgc1} alt="Image 1"/></div>
        <div class="carousel-item"><img src={imgc2} alt="Image 2"/></div>
        <div class="carousel-item"><img src={imgc3} alt="Image 3"/></div>
    </div>
    <button class="prev" onclick="moveCarousel(-1)">&#10094;</button>
    <button class="next" onclick="moveCarousel(1)">&#10095;</button>
</div>

<div class="video-container">
    <video controls>
        <source src={video} type="video/mp4"/>
        Your browser does not support the video tag.
    </video>
</div>

</main> </>
  )
}

export default HomePage