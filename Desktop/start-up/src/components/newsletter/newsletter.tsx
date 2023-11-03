import { Box, Button, Card, CardBody, Heading, Input, Stack, Text } from "@chakra-ui/react"
import SectionTitle from "../section-title/section-title"

const NewsLetter = () => {
  return (
    <Card mt={10}>
      <CardBody minH={'50vh'}  display={'flex'} justifyContent={'center'} alignItems={'center'}>
         <Stack spacing={3}>
          <SectionTitle 
          textAlign={'center'}
          maxW={'container.sm'}
          title="Subscribe our NewsLetter &" 
          subTitle="Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto vitae, officia cum eum deleniti excepturi nesciunt? Nostrum id veniam magni reiciendis ipsam quidem sed deserunt placeat laudantium optio? Alias, earum!"/>         
          <Box pos={'relative'} >
            <Input placeholder="Your email" 
            bg={'white'} color={'gray.900'}
            h={14}
            w={'full'}
             _placeholder={{color:'gray.500'}}
             />
            <Button pos={'absolute'} right={2} top={2} colorScheme={'facebook'} zIndex={999}>
							Submit
						</Button>

           </Box>
         </Stack>
      </CardBody>
    </Card>
  )
}

export default NewsLetter