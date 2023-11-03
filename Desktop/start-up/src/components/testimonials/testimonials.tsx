import Carousel from "react-multi-carousel"
import SectionTitle from "../section-title/section-title"
import { testimonialCarusel } from "src/config/carusel"
import { Center, Container, Heading, Icon, Text } from "@chakra-ui/react"
import { ImQuotesRight } from "react-icons/im"

const Testimonials = () => {
  return (
    <>
    <SectionTitle textAlign={'center'} title='Testimonials' subTitle='10,000+ unique online course list designs' />
    <Carousel responsive={testimonialCarusel} arrows={true} showDots={false} autoPlay={true} autoPlaySpeed={1000} infinite>
         {data.map((item,idx) => (
          <Center key={idx} flexDirection={'column'} maxWidth={'container.sm'} mx={'auto'}>
            <Icon as={ImQuotesRight} fontSize={100}/>
             <Text textAlign={'center'} mt={5}>{item.description}</Text>
            <Heading fontSize={'xl'} fontWeight={'bold'} mt={3}>{item.name}</Heading>
          </Center>
         ))}
    </Carousel>
    </>
  )
}

export default Testimonials

const data = [
	{
		name: 'Samar Badriddinov',
		description:
			'It is no exaggeration to say this Educrat experience was transformative–both professionally and personally. This workshop will long remain a high point of my life.',
	},
	{
		name: 'Yusuf Khamdamov',
		description:
			'It is no exaggeration to say this Educrat experience was transformative–both professionally and personally. This workshop will long remain a high point of my life.',
	},
	{
		name: 'Abdulloh Oripov',
		description:
			'It is no exaggeration to say this Educrat experience was transformative–both professionally and personally. This workshop will long remain a high point of my life.',
	},
	{
		name: 'Shoxrux Yusupov',
		description:
			'It is no exaggeration to say this Educrat experience was transformative–both professionally and personally. This workshop will long remain a high point of my life.',
	},
];