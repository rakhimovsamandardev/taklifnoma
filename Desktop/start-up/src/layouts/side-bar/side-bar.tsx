import {Box, Button, Container, HStack, Heading, Icon, Text, useColorModeValue} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { navigation } from 'src/config/constants';
import { SideBarProps } from './side-bar.props';
const Sidebar = ({toggle}:SideBarProps):JSX.Element => {
  const router = useRouter()
  return (
    <Box 
    w={{base:'full',lg:'300px'}}
    h={'90vh'}
    pos={'fixed'}
    top={'10vh'}
    left={{base:toggle ? 0:'-100%',lg:0}}
    zIndex={1001}
    overflowY={'scroll'}
    css={{
      '&::-webkit-scrollbar': { width: '1px' },
      '&::-webkit-scrollbar-track': { width: '1px' },
      '&::-webkit-scrollbar-thumb': { background: 'transparent' },
    }}
    transition={'all .4s ease'}
    bg={useColorModeValue('gray.50','gray.900')} 
    color={useColorModeValue('gray.700','gray.200')}
    borderRight={'1px'} 
    borderRightColor={useColorModeValue('gray.200','gray.600')}
    >
     <Container maxW={'container.xl'} mt={10}>
      {navigation.map((item,idx) => (
        <Box key={idx}>
          <Text>{item.title}</Text>
          {item.links.map((nav,idx) => {
            const active = router.asPath == nav.route
            return (
              <Link key={idx} href={nav.route}>
                <Button 
                colorScheme="facebook"
                 variant={active ? 'solid':'ghost'}
                 w={'full'}
                 mt={2}
                 h={14}
                 justifyContent={'flex-start'}
                >
                 <HStack>
                  <Icon as={nav.icon} />
                  <Text>{nav.label}</Text>
                 </HStack>
                  </Button>
              </Link>
            )
          })}
        </Box>
      ))}
     </Container>
    </Box>
  )
}

export default Sidebar