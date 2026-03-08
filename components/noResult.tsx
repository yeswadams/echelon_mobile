import React from 'react'
import { View, Text, Image } from 'react-native'
import images from '@/constants/images'

const NoResult = () => {
  return (
    <View className='flex items-center my-5'>
      <Image source={images.noResult} className='w-11/12 h-60' resizeMode='contain'/>
      <Text className='text-2xl font-rubik-bold text-black mt-5'>No Result</Text>
      <Text className='text-base text-black-300 mt-2'>No Properties Found</Text>
    </View>
  )
}

export default NoResult