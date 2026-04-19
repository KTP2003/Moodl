'use client'
import { Fugaz_One } from 'next/font/google';
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Button from './Button';
import { useAuth } from '@/context/AuthContext';
const fugaz = Fugaz_One({ subsets: ["latin"], weight: ['400'] });

export default function Login() {
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isRegister, setIsRegister] = useState(false)
    const [authenticating, setAuthenticating] = useState(false)
    const [formError, setFormError] = useState('')

    const { signup, login } = useAuth()

    useEffect(() => {
        const mode = searchParams.get('mode')
        if (mode === 'register') setIsRegister(true)
        if (mode === 'login') setIsRegister(false)
    }, [searchParams])

    async function handleSubmit() {
        setFormError('')
        if (!email?.trim() || !password) {
            setFormError('Please enter email and password.')
            return
        }
        if (password.length < 6) {
            setFormError('Password must be at least 6 characters (Firebase requirement).')
            return
        }
        setAuthenticating(true)
        try {
            if (isRegister) {
                console.log('Signing up a new user')
                await signup(email.trim(), password)
            } else {
                console.log('Logging in existing user')
                await login(email.trim(), password)
            }

        } catch (err) {
            console.log(err.message)
            setFormError(err.message || 'Something went wrong. Try again.')
        } finally {
            setAuthenticating(false)
        }

    }

    return (
        <div className='flex flex-col flex-1 justify-center items-center gap-4'>
            <h3 className={'text-4xl sm:text-5xl md:text-6xl ' + fugaz.className}>{isRegister ? 'Register' : 'Log In'}</h3>
            <p>You&#39;re one step away!</p>
            <form
                className='flex flex-col gap-4 w-full max-w-[400px] mx-auto items-center'
                onSubmit={async (e) => {
                    e.preventDefault()
                    await handleSubmit()
                }}
            >
            <input value={email} onChange={(e) => {
                setEmail(e.target.value)
            }} className='w-full max-w-[400px] mx-auto px-3 duration-200 hover:border-indigo-600 focus:border-indigo-600 py-2 sm:py-3 border border-solid border-indigo-400 rounded-full outline-none' placeholder='Email' autoComplete='email' />
            <input value={password} onChange={(e) => {
                setPassword(e.target.value)
            }} className='w-full max-w-[400px] mx-auto px-3 duration-200 hover:border-indigo-600 focus:border-indigo-600 py-2 sm:py-3 border border-solid border-indigo-400 rounded-full outline-none' placeholder='Password (min 6 characters)' type='password' autoComplete={isRegister ? 'new-password' : 'current-password'} />
            {formError ? (
                <p className='w-full text-center text-sm text-red-600' role='alert'>{formError}</p>
            ) : null}
            <div className='max-w-[400px] w-full mx-auto'>
                <Button type='submit' text={authenticating ? 'Submitting' : "Submit"} full />
            </div>
            </form>
            <p className='text-center'>{isRegister ? 'Already have an account? ' : 'Don\'t have an account? '}<button onClick={() => setIsRegister(!isRegister)} className='text-indigo-600'>{isRegister ? 'Sign in' : 'Sign up'}</button></p>
        </div>
    )
}

