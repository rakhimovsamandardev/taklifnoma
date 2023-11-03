
import { DarkLogo, LightLogo, UzbIcons,EngIcons,RusIcons } from 'src/icons'
import { headerProps } from './header.props'
import { Box, Button, Flex, HStack, IconButton, Menu, MenuButton,Icon, useColorMode,MenuList,MenuItem,useColorModeValue} from '@chakra-ui/react'
import {BsFillSunFill,BsFillMoonFill,BsTranslate,} from 'react-icons/bs'
import {BiUserCircle,BiMenuAltLeft} from 'react-icons/bi'
import {MdContactSupport} from 'react-icons/md'
import Link from 'next/link'

const Header = ({onTogle}:headerProps):JSX.Element => {
  const {toggleColorMode,colorMode} = useColorMode()
  return (
     <Box
     zIndex={1001}
     bg={useColorModeValue('gray.50','gray.900')}
     color={useColorModeValue('gray.700','gray.200')}
      pos={'fixed'}
      top={0}
      left={0}
      right={0}
      width={'full'} height={'10vh'} px={10} borderBottom={'1px'} borderBottomColor={useColorModeValue("gray.200","gray.600")}>
       <Flex h={'full'} justify={'space-between'} align={'center'}>
         <HStack>
           <Icon as={BiMenuAltLeft} onClick={onTogle} w={6} h={6} cursor={"pointer"}/>
          <Link href={'/'}>
            {colorMode == 'light' ? <DarkLogo/>:<LightLogo/>}
          </Link>
         </HStack>
         <HStack>
         <IconButton aria-label='support' icon={<MdContactSupport/>} colorScheme={'facebook'} variant={'ghost'}/>
          <Menu>
            <MenuButton as={IconButton} icon={<BsTranslate/>} colorScheme={'facebook'} variant={'solid'}/>
            <MenuList>
             <MenuItem icon={<UzbIcons/>}>UZB</MenuItem>
             <MenuItem icon={<RusIcons/>}>RUS</MenuItem>
             <MenuItem icon={<EngIcons/>}>ENG</MenuItem>
            </MenuList>
          </Menu>
          <IconButton
          onClick={toggleColorMode}
           aria-label='color-mode' 
           icon={colorMode === 'light' ? <BsFillMoonFill/>:<BsFillSunFill/>}
           colorScheme={'facebook'}
           variant={'outline'}
           />
           <Button rightIcon={<BiUserCircle />} colorScheme={'facebook'}>
						LOGIN
					</Button>
           
         </HStack>
       </Flex>
     </Box>
  )
}

export default Header