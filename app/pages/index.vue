<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-vue-next'
import { useApi } from '~/composables/useApi'

const { setToken } = useAuth()
const mode = ref<'login' | 'signup'>('login')
const loginError = ref('')
const registerError = ref<Record<string, string>>({})
const step = ref(0)
const showPassword = ref(false)
const confirmShowPassword = ref(false)

// Dados persistidos dos formulários
const step0Data = ref({ username: '', email: '' })
const loginData = ref({ email: '', password: '' })

const loginSchema = toTypedSchema(
  z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
)

const signupStep0Schema = toTypedSchema(
  z.object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email'),
  })
)

const signupStep1Schema = toTypedSchema(
  z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
    terms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms of use',
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
)

const api = useApi()

const onLoginSubmit = async (values: any) => {
  loginError.value = ''
  loginData.value = values
  const payload = {
    email: values.email,
    hash_pass: values.password,
  }
  try {
    const response = await api.post('/login', payload) as any
    setToken(response.token)
    navigateTo('/dashboard')
  } catch (error: any) {
    const data = error?.response?._data
    console.log('Erro Laravel:', JSON.stringify(data, null, 2))
    if (error?.response?.status === 422) {
      const errors = data?.errors
      loginError.value = errors ? Object.values(errors).flat().join(' ') : (data?.message || 'Invalid credentials')
    } else {
      loginError.value = 'An error occurred. Please try again.'
    }
  }
}

const onStep0Submit = (values: any) => {
  step0Data.value = values
  step.value = 1
}

const onStep1Submit = async (values: any) => {
  registerError.value = {}
  const { terms, confirmPassword, password } = values
  const payload = {
    name: step0Data.value.username,
    email: step0Data.value.email,
    hash_pass: password,
    password_confirmation: confirmPassword,
  }
  console.log('Payload enviado:', payload)
  try {
    const response = await api.post('/register', payload) as any
    console.log('Registered:', response)
    // redirecionar: navigateTo('/dashboard')
  } catch (error: any) {
    const data = error?.response?._data
    console.log('Erro Laravel:', JSON.stringify(data, null, 2))
    if (error?.response?.status === 422 && data?.errors) {
      registerError.value = Object.fromEntries(
        Object.entries(data.errors).map(([key, val]: any) => [key, val[0]])
      )
    } else {
      registerError.value = { general: data?.message || 'An error occurred. Please try again.' }
    }
  }
}

const handleBack = () => {
  step.value = 0
}
</script>

<template>
  <div class="flex max-[1000px]:flex-row items-center  flex-row-reverse justify-center min-h-screen bg-slate-900 max-[1000px]:bg-slate-950 gap-8">
    <div class="w-full flex items-center justify-center relative max-[1000px]:hidden">
      <img src="/backdrop.png" alt="Doom"  />
    </div>
    <div class="flex flex-col space-y-2 p-6 h-screen items-center w-140 bg-slate-950 text-white justify-center z-10">
      <h1 class="self-center text-xl font-semibold mb-8">
        {{ mode === "login" ? "Login" : "Register" }}
      </h1>

      <Form v-if="mode === 'login'" :validation-schema="loginSchema" :initial-values="loginData" @submit="onLoginSubmit" class="w-full space-y-4">
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input v-bind="componentField" type="email" placeholder="johndoe@gmail.com" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <div class="relative">
                <Input
                  v-bind="componentField"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="•••••••••"
                />
                <button type="button" class="absolute right-2 top-1.5" @click="showPassword = !showPassword">
                  <Eye v-if="showPassword" class="w-5 h-5" />
                  <EyeOff v-else class="w-5 h-5" />
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <p v-if="loginError" class="text-sm text-rose-400">{{ loginError }}</p>

        <div class="flex flex-row gap-2 justify-between items-center">
          <p class="text-sm text-center">
            Don't have an account?
            <button type="button" @click="() => { mode = 'signup'; step = 0 }" class="font-semibold text-rose-400 cursor-pointer underline underline-offset-4">
              Sign Up
            </button>
          </p>
          <Button type="submit" class="border-2 border-rose-400 text-white bg-transparent hover:bg-rose-400 cursor-pointer">
            Sign In
          </Button>
        </div>
      </Form>

      <Form v-else-if="step === 0" :validation-schema="signupStep0Schema" :initial-values="step0Data" @submit="onStep0Submit" class="w-full space-y-4">
        <FormField v-slot="{ componentField }" name="username">
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="John Doe" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input v-bind="componentField" type="email" placeholder="johndoe@gmail.com" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div class="flex justify-between items-center gap-2">
          <p class="text-sm text-center">
            Already have an account?
            <button type="button" @click="mode = 'login'" class="font-semibold text-rose-400 cursor-pointer underline underline-offset-4">
              Sign In
            </button>
          </p>
          <Button type="submit" class="border-2 border-rose-400 text-white bg-transparent hover:bg-rose-400 cursor-pointer">
            Next
            <ArrowRight class="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Form>

      <Form v-else :validation-schema="signupStep1Schema" @submit="onStep1Submit" class="w-full space-y-4">
        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <div class="relative">
                <Input v-bind="componentField" :type="showPassword ? 'text' : 'password'" placeholder="•••••••••" />
                <button type="button" class="absolute right-2 top-1.5" @click="showPassword = !showPassword">
                  <Eye v-if="showPassword" class="w-5 h-5" />
                  <EyeOff v-else class="w-5 h-5" />
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="confirmPassword">
          <FormItem>
            <FormLabel>Confirm Your Password</FormLabel>
            <FormControl>
              <div class="relative">
                <Input v-bind="componentField" :type="confirmShowPassword ? 'text' : 'password'" placeholder="•••••••••" />
                <button type="button" class="absolute right-2 top-1.5" @click="confirmShowPassword = !confirmShowPassword">
                  <Eye v-if="confirmShowPassword" class="w-5 h-5" />
                  <EyeOff v-else class="w-5 h-5" />
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="terms" type="checkbox">
          <FormItem class="flex flex-row items-center gap-2">
            <FormControl>
              <Checkbox v-bind="componentField" class="cursor-pointer" />
            </FormControl>
            <FormLabel class="text-sm font-normal cursor-pointer">
              I accept the terms of use
            </FormLabel>
          </FormItem>
        </FormField>

        <div v-if="Object.keys(registerError).length > 0" class="space-y-1">
          <p v-for="(msg, field) in registerError" :key="field" class="text-sm text-rose-400">
            {{ field !== 'general' ? `${field}: ` : '' }}{{ msg }}
          </p>
        </div>

        <div class="flex gap-2 justify-between">
          <Button type="button" @click="handleBack" class="border-2 border-rose-400 text-white bg-transparent hover:bg-rose-400 cursor-pointer">
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" class="border-2 border-rose-400 text-white bg-transparent hover:bg-rose-400 cursor-pointer">
            Register
          </Button>
        </div>
      </Form>

    </div>
  </div>
</template>