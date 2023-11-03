import {FunctionComponent, useState} from 'react'
import { LayoutProps } from './layout.props'
import { Box, Container } from '@chakra-ui/react'
import { Header, SideBar } from './index'
import Footer from './footer/footer'


const Layout = ({children}:LayoutProps):JSX.Element => {
  const [toggle,setToggle] = useState<boolean>(false)
  const onTogle = () => setToggle(prev => !prev);
  return (
    <Box maxWidth={'full'} overflow={'hidden'}>
        <Header onTogle={onTogle}/>
        <SideBar toggle={toggle}/>
       <Box mt={'11vh'} minH={'90vh'} pl={{base:0,lg:'320px'}} transition={'all .4s ease'}>
        <Container maxW={'container.lg'} className="">{children}</Container>
      </Box>
      <Footer/>
    </Box>
    
  )
}
export default Layout
export const withLayout = <T extends Record<string,unknown>>(Component:FunctionComponent<T>) => {
    return  function withLayoutComponent(props:T):JSX.Element {
       return (
        <Layout>
            <Component {...props}/>
        </Layout>
       )
    }
}