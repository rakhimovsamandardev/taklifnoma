import { Stack } from "@chakra-ui/react"
import { HomePageComponentProps } from "./home-page-component.props"
import { Categories, Hero, HowItWorks } from "src/components"
import PopularCourses from "src/components/popular-courses/popular-courses"
import Instructors from "src/components/instructors/instructors"
import Testimonials from "src/components/testimonials/testimonials"
import NewsLetter from "src/components/newsletter/newsletter"
import Sposorship from "src/components/sposorship/sposorship"

const HomePageComponent = ({}:HomePageComponentProps):JSX.Element => {
  return (
    <Stack spacing={10}>
      <Hero/>
      <Categories/>
      <PopularCourses/>
      <HowItWorks/>
      <Instructors/>
      <Testimonials/>
      <NewsLetter/>
      <Sposorship/>
    </Stack>
  )
}

export default HomePageComponent