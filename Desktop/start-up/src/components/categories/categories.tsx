import Carousel from "react-multi-carousel"
import SectionTitle from "../section-title/section-title"
import { categories } from "src/config/constants"
import { Box, Icon, Text, useColorModeValue } from "@chakra-ui/react"
import { categoryCarusel } from "src/config/carusel"

const Categories = () => { 
  const bgColor = useColorModeValue('gray.200','gray.900')
  const fill = useColorModeValue('#020288','gray.600')
  return (
    <>
     <SectionTitle title="Top Category" subTitle="Learn our courses with hogh rating"/>
     <Carousel 
     responsive={categoryCarusel} 
     arrows={false} showDots={false} 
     autoPlay={true} autoPlaySpeed={2000} 
     infinite>
      {categories.map(c => (
        <Box 
        key={c.id} 
        bgColor={bgColor}
         minH={'200px'} 
         mx={2}
         textAlign={'center'}
         cursor={'pointer'}
         p={5}
         borderRadius={'lg'}>
          <Icon as={c.icon} w={20} h={20} fill={fill}/>
          <Text mt={2} fontSize={'lg'}>{c.name}</Text>
        </Box>
      ))}
     </Carousel>
    </>
  )
}

export default Categories