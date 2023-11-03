
import { Box, Heading, Text } from "@chakra-ui/react"
import { SectionTitleProps } from "./section-title.props"

const SectionTitle = ({subTitle,title,...props}:SectionTitleProps):JSX.Element => {
  return (
    <Box {...props}>
        <Heading as={'h3'} className="">{title}</Heading>
        <Text mt={1} opacity={'.8'}>{subTitle}</Text>
    </Box>
  )
}

export default SectionTitle