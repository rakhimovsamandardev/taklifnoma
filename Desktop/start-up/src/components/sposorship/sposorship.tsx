import Carousel from "react-multi-carousel"
import SectionTitle from "../section-title/section-title"
import { sponsorshipCarousel } from "src/config/carusel"
import { trustedCompeny } from "src/config/constants"
import { Icon } from "@chakra-ui/react"

const Sposorship = () => {
  return (
    <>
	<SectionTitle title='' subTitle='Trusted by the world’s best' textAlign={'center'} mb={5} />
    <Carousel responsive={sponsorshipCarousel} arrows={false} showDots={false} autoPlay={true} autoPlaySpeed={1000} infinite>
    {trustedCompeny.map((item,idx) => (
        <Icon key={idx} as={item} fontSize={50}/>
    ))}

    </Carousel>
    </>
  )
}

export default Sposorship