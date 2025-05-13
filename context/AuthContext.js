//first client-side component
'use client'
import { auth, db } from "@/firebase"
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import React from "react"
import { useContext, useEffect, useState } from "react"

const AuthContext=React.createContext()

export function useAuth(){
    return useContext(AuthContext)
}

export function AuthProvider({children}){
    const [currentUser,setCurrentUser]= useState(null)
    const [userDataObj,setUserDataObj]= useState(null)
    const [loading,setLoading]=useState(true)

    //AUTH Handlres
    function signup(email,password){
        return createUserWithEmailAndPassword(auth,email,password)
    }

    function login(email,password){
        return signInWithEmailAndPassword(auth,email,password)
    }

    function logout(){
        setUserDataObj(null)
        setCurrentUser(null)
        return signOut(auth)
    }

    useEffect(()=>{
        const unsubscribe=onAuthStateChanged(auth,async user=>{
            try {
                //Set the user to our local context state
                setLoading(true)
                setCurrentUser(user)
                if(!user){
                    console.log('No User Found!')
                    return
                }
                
                //if user exists,fetch data from Firestore db
                console.log('Fetching user Data')
                const docRef=doc(db,'users',user.uid)
                const docSnap=await getDoc(docRef)
                let firebaseData={}
                if(docSnap.exists()){
                    console.log('Found user data')
                    firebaseData=docSnap.data()
                    console.log(firebaseData)
                }
                setUserDataObj(firebaseData)

            } catch (err) {
                console.log(err.message)
            }finally{
                setLoading(false)
            }
        })
        return unsubscribe
    },[]) //if any values in [],it executes to any changes in the dependencies

    const value={
        currentUser,
        userDataObj,
        setUserDataObj,
        signup,
        logout,
        login,
        loading
    }
    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}