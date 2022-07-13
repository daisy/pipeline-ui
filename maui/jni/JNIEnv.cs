// Setting the SuppressUnmanagedCodeSecurity should improve performance of these calls as 
// it will allow managed code to call into unmanaged code without a stack walk. Resulting in a 
// substantial performance savings in applications that make multiple JNI calls

using System;
using System.Runtime.InteropServices;
using System.Security;




// Type Aliases as descibed in jni.h and jni_d.h for an OpenJDK 11 install
using jint = System.Int32; // Follwing jni_md.h definition for win32
using jlong = System.Int64; // Follwing jni_md.h definition for win32
using jbyte = System.SByte; // Follwing jni_md.h definition for win32 (signed char)
using jboolean = System.Byte;
using jchar = System.UInt16;
using jshort = System.Int16;
using jfloat = System.Single;
using jdouble = System.Double;

// Special jni types aliases that we represent as raw memory pointers
// (instead of setting IntPtr everywhere, 
// I prefere to use aliases here to better understand the object hidden behind the pointer)
using jobject = System.IntPtr;
using jclass = System.IntPtr;
using jthrowable = System.IntPtr;
using jstring = System.IntPtr;
using jarray = System.IntPtr;
using jbooleanArray = System.IntPtr;
using jbyteArray = System.IntPtr;
using jcharArray = System.IntPtr;
using jshortArray = System.IntPtr;
using jintArray = System.IntPtr;
using jlongArray = System.IntPtr;
using jfloatArray = System.IntPtr;
using jdoubleArray = System.IntPtr;
using jobjectArray = System.IntPtr;
using jweak = System.IntPtr;
using jfieldID = System.IntPtr;
using jmethodID = System.IntPtr;
using jobjectRefType = System.IntPtr;

using JNIEnvPtr = System.IntPtr;
using System.Collections.Generic;

// const char * types are mapped by [MarshalAs(UnmanagedType.LPStr)] string in delegation declaration

namespace org.daisy.jnet {
    /// <summary>
    /// Reconstruction of the JNIEnv_ C++ structure described in jni.h, using function delegation
    /// </summary>
    public unsafe class JNIEnv : IDisposable {
        
        // Pointer to the original JNIEnv structure used by the JNI
        private JNIEnvPtr Env;

        private JNINativeInterface functions;

        private JavaVM? javaVM;

        internal JNIEnv(JNIEnvPtr jnienv) {
            this.Env = jnienv;
            functions = *(*(JNINativeInterfacePtr*)jnienv.ToPointer()).functions;
        }



        public jint GetVersion() {
            if (getVersion == null) {
                getVersion = JavaVM.GetDelegateForFunctionPointer(functions.GetVersion, getVersion);
            }
            jint res = getVersion.Invoke(Env);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public int GetMajorVersion() {
            return GetVersion() >> 16;
        }

        public int GetMinorVersion() {
            return GetVersion() % 65536;
        }

        public JavaVM GetJavaVM() {
            if (getJavaVM == null) {
                getJavaVM = JavaVM.GetDelegateForFunctionPointer(functions.GetJavaVM, getJavaVM);
            }

            if (javaVM == null) {
                IntPtr jvm;
                getJavaVM.Invoke(Env, out jvm);
                javaVM = new JavaVM(jvm);
            }
            return javaVM;
        }

        public jclass FindClass(string name) {
            if (findClass == null) {
                findClass = JavaVM.GetDelegateForFunctionPointer(functions.FindClass, findClass);
            }
            jclass res = findClass(Env, name);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public jmethodID FromReflectedMethod(jobject method) {
            if (fromReflectedMethod == null) {
                fromReflectedMethod = JavaVM.GetDelegateForFunctionPointer(functions.FromReflectedMethod, fromReflectedMethod);
            }
            jmethodID res = fromReflectedMethod.Invoke(Env, method);
            CheckJavaExceptionAndThrow();
            return res;
        }


        public jfieldID FromReflectedField(jobject field) {
            if (fromReflectedField == null) {
                fromReflectedField = JavaVM.GetDelegateForFunctionPointer(functions.FromReflectedField, fromReflectedField);
            }
            jfieldID res = fromReflectedField.Invoke(Env, field);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public jobject ToReflectedMethod(jclass cls, jmethodID methodID, jboolean isStatic) {
            if (toReflectedMethod == null) {
                toReflectedMethod = JavaVM.GetDelegateForFunctionPointer(functions.ToReflectedMethod, toReflectedMethod);
            }
            jobject res = toReflectedMethod.Invoke(Env, cls, methodID, isStatic);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public jclass GetSuperclass(jclass sub) {
            if (getSuperclass == null) {
                getSuperclass = JavaVM.GetDelegateForFunctionPointer(functions.GetSuperclass, getSuperclass);
            }
            jclass res = getSuperclass.Invoke(Env, sub);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public jboolean IsAssignableFrom(jclass sub, jclass sup) {
            if (isAssignableFrom == null) {
                isAssignableFrom = JavaVM.GetDelegateForFunctionPointer(functions.IsAssignableFrom, isAssignableFrom);
            }
            jboolean res = isAssignableFrom.Invoke(Env, sub, sup);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public jclass GetObjectClass(jobject obj) {
            if (getObjectClass == null) {
                getObjectClass = JavaVM.GetDelegateForFunctionPointer(functions.GetObjectClass, getObjectClass);
            }
            jclass clazz = getObjectClass.Invoke(Env, obj);
            CheckJavaExceptionAndThrow();
            return clazz;
        }

        public IntPtr GetMethodID(jclass clazz, string name, string sig) {
            lock (this)
            {
                if (getMethodID == null)
                {
                    getMethodID = JavaVM.GetDelegateForFunctionPointer(functions.GetMethodID, getMethodID);
                }

                IntPtr res = getMethodID.Invoke(Env, clazz, name, sig);
                CheckJavaExceptionAndThrow();
                return res;
            }
            
        }

        public IntPtr GetFieldID(jclass clazz, string name, string sig) {
            if (getFieldID == null) {
                getFieldID = JavaVM.GetDelegateForFunctionPointer(functions.GetFieldID, getFieldID);
            }
            IntPtr res = getFieldID.Invoke(Env, clazz, name, sig);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public IntPtr GetStaticFieldID(IntPtr classHandle, string name, string sig) {
            if (getStaticFieldID == null) {
                getStaticFieldID = JavaVM.GetDelegateForFunctionPointer(functions.GetStaticFieldID, getStaticFieldID);
            }
            IntPtr res = getStaticFieldID(Env, classHandle, name, sig);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public IntPtr GetStaticMethodID(jclass clazz, string name, string sig) {
            if (getStaticmethodID == null) {
                getStaticmethodID = JavaVM.GetDelegateForFunctionPointer(functions.GetStaticmethodID, getStaticmethodID);
            }
            IntPtr res = getStaticmethodID.Invoke(Env, clazz, name, sig);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public jobjectRefType GetObjectRefType(jobject obj) {
            if (getObjectRefType == null) {
                getObjectRefType = JavaVM.GetDelegateForFunctionPointer(functions.GetObjectRefType, getObjectRefType);
            }
            jobjectRefType res = getObjectRefType.Invoke(Env, obj);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public IntPtr GetModule(jclass clazz) {
            if (getObjectRefType == null) {
                getModule = JavaVM.GetDelegateForFunctionPointer(functions.GetModule, getModule);
            }
            IntPtr res = getModule.Invoke(Env, clazz);
            CheckJavaExceptionAndThrow();
            return res;
        }


        public IntPtr NewObject(jclass clazz,  jmethodID methodID, params JValue[] args) {
            if (newObject == null) {
                newObject = JavaVM.GetDelegateForFunctionPointer(functions.NewObjectA, newObject);
            }

            IntPtr res = newObject(Env, clazz, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        internal IntPtr AllocObject(IntPtr classHandle) {
            if (allocObject == null) {
                allocObject = JavaVM.GetDelegateForFunctionPointer(functions.AllocObject, allocObject);
            }
            IntPtr res = allocObject(Env, classHandle);
            CheckJavaExceptionAndThrow();
            return res;
        }

        // RegisterNatives\UnRegisterNatives will not work until I fix the the class JNINativeMethod
        public int RegisterNatives(IntPtr classHandle, JNINativeMethod* methods, int nMethods) {
            if (registerNatives == null) {
                registerNatives = JavaVM.GetDelegateForFunctionPointer(functions.RegisterNatives, registerNatives);
            }
            int res = registerNatives.Invoke(Env, classHandle, methods, nMethods);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public int UnregisterNatives(IntPtr classHandle) {
            if (unregisterNatives == null) {
                unregisterNatives = JavaVM.GetDelegateForFunctionPointer(functions.UnregisterNatives, unregisterNatives);
            }
            int res = unregisterNatives.Invoke(Env, classHandle);
            CheckJavaExceptionAndThrow();
            return res;
        }

        #region Reflection Support

        public IntPtr ToReflectedField(IntPtr classHandle, IntPtr fieldID, bool isStatic) {
            if (toReflectedField == null) {
                toReflectedField = JavaVM.GetDelegateForFunctionPointer(functions.ToReflectedField, toReflectedField);
            }
            IntPtr res = toReflectedField.Invoke(Env, classHandle, fieldID,
                                                 JavaVM.BooleanToByte(isStatic));
            CheckJavaExceptionAndThrow();
            return res;
        }

        public IntPtr ToReflectedMethod(IntPtr classHandle,  jmethodID methodID, bool isStatic) {
            if (toReflectedMethod == null) {
                toReflectedMethod = JavaVM.GetDelegateForFunctionPointer(functions.ToReflectedMethod, toReflectedMethod);
            }
            IntPtr res = toReflectedMethod.Invoke(Env, classHandle, methodID,
                                                  JavaVM.BooleanToByte(isStatic));
            CheckJavaExceptionAndThrow();
            return res;
        }



        #endregion

        #region Call instance Methods

        // Calling this method raises a pInvokeStackImbalance error in .net 4 if you do not call their A couterpart
        // i.e do not use functions.CallObjectMethod but use functions.CallObjectMethodA
        public IntPtr CallObjectMethod(jobject obj,  jmethodID methodID, params JValue[] args) {
            if (callObjectMethod == null) {
                callObjectMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallObjectMethodA, callObjectMethod);
            }
            IntPtr res = callObjectMethod(Env, obj, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public bool CallBooleanMethod(jobject obj,  jmethodID methodID, params JValue[] args) {
            if (callBooleanMethod == null) {
                callBooleanMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallBooleanMethodA, callBooleanMethod);
            }
            bool res = callBooleanMethod(Env, obj, methodID, args) != 0;
            CheckJavaExceptionAndThrow();
            return res;
        }

        public int CallIntMethod(jobject obj,  jmethodID methodID, params JValue[] args) {
            if (callIntMethod == null) {
                callIntMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallIntMethodA, callIntMethod);
            }
            int res = callIntMethod(Env, obj, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public short CallShortMethod(jobject obj,  jmethodID methodID, params JValue[] args) {
            if (callShortMethod == null) {
                callShortMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallShortMethodA, callShortMethod);
            }
            short res = callShortMethod(Env, obj, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public long CallLongMethod(jobject obj,  jmethodID methodID, params JValue[] args) {
            if (callLongMethod == null) {
                callLongMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallLongMethodA, callLongMethod);
            }
            long res = callLongMethod(Env, obj, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public sbyte CallByteMethod(jobject obj,  jmethodID methodID, params JValue[] args) {
            if (callByteMethod == null) {
                callByteMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallByteMethodA, callByteMethod);
            }
            sbyte res = callByteMethod(Env, obj, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public double CallDoubleMethod(jobject obj,  jmethodID methodID, params JValue[] args) {
            if (callDoubleMethod == null) {
                callDoubleMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallDoubleMethodA, callDoubleMethod);
            }
            double res = callDoubleMethod(Env, obj, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public float CallFloatMethod(jobject obj,  jmethodID methodID, params JValue[] args) {
            if (callFloatMethod == null) {
                callFloatMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallFloatMethodA, callFloatMethod);
            }
            float res = callFloatMethod(Env, obj, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public char CallCharMethod(jobject obj,  jmethodID methodID, params JValue[] args) {
            if (callCharMethod == null) {
                callCharMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallCharMethodA, callCharMethod);
            }
            var res = (char)callCharMethod(Env, obj, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public void CallVoidMethod(jobject obj,  jmethodID methodID, params JValue[] args) {
            if (callVoidMethod == null) {
                callVoidMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallVoidMethodA, callVoidMethod);
            }
            callVoidMethod(Env, obj, methodID, args);
            CheckJavaExceptionAndThrow();
            return;
        }

        #endregion

        #region Call Static Methods

        public void CallStaticVoidMethod(jclass clazz, jmethodID methodID, params JValue[] args) {
            if (callStaticVoidMethod == null) {
                callStaticVoidMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallStaticVoidMethodA, callStaticVoidMethod);
            }
            callStaticVoidMethod(Env, clazz, methodID, args);
            CheckJavaExceptionAndThrow();
        }

        public IntPtr CallStaticObjectMethod(jclass clazz, jmethodID methodID, params JValue[] args) {
            if (callStaticObjectMethod == null) {
                callStaticObjectMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallStaticObjectMethodA, callStaticObjectMethod);
            }
            IntPtr res = callStaticObjectMethod(Env, clazz, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public int CallStaticIntMethod(jclass clazz,  jmethodID methodID, params JValue[] args) {
            if (callStaticIntMethod == null) {
                callStaticIntMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallStaticIntMethodA, callStaticIntMethod);
            }
            int res = callStaticIntMethod(Env, clazz, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public long CallStaticLongMethod(jclass clazz,  jmethodID methodID, params JValue[] args) {
            if (callStaticLongMethod == null) {
                callStaticLongMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallStaticLongMethodA, callStaticLongMethod);
            }
            long res = callStaticLongMethod(Env, clazz, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public double CallStaticDoubleMethod(jclass clazz,  jmethodID methodID, params JValue[] args) {
            if (callStaticDoubleMethod == null) {
                callStaticDoubleMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallStaticDoubleMethodA, callStaticDoubleMethod);
            }
            double res = callStaticDoubleMethod(Env, clazz, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public float CallStaticFloatMethod(jclass clazz,  jmethodID methodID, params JValue[] args) {
            if (callStaticFloatMethod == null) {
                callStaticFloatMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallStaticFloatMethodA, callStaticFloatMethod);
            }
            float res = callStaticFloatMethod(Env, clazz, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public short CallStaticShortMethod(jclass clazz,  jmethodID methodID, params JValue[] args) {
            if (callStaticShortMethod == null) {
                callStaticShortMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallStaticShortMethodA, callStaticShortMethod);
            }
            short res = callStaticShortMethod(Env, clazz, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public char CallStaticCharMethod(jclass clazz,  jmethodID methodID, params JValue[] args) {
            if (callStaticCharMethod == null) {
                callStaticCharMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallStaticCharMethodA, callStaticCharMethod);
            }
            var res = (char)callStaticCharMethod(Env, clazz, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public bool CallStaticBooleanMethod(jclass clazz,  jmethodID methodID, params JValue[] args) {
            if (callStaticBooleanMethod == null) {
                callStaticBooleanMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallStaticBooleanMethodA, callStaticBooleanMethod);
            }
            bool res = callStaticBooleanMethod(Env, clazz, methodID, args) != 0;
            CheckJavaExceptionAndThrow();
            return res;
        }

        public sbyte CallStaticByteMethod(jclass clazz,  jmethodID methodID, params JValue[] args) {
            if (callStaticByteMethod == null) {
                callStaticByteMethod = JavaVM.GetDelegateForFunctionPointer(functions.CallStaticByteMethodA, callStaticByteMethod);
            }
            sbyte res = callStaticByteMethod(Env, clazz, methodID, args);
            CheckJavaExceptionAndThrow();
            return res;
        }

        #endregion

        #region Array definitions

        public IntPtr NewObjectArray(int len, IntPtr classHandle, IntPtr init) {
            if (newObjectArray == null) {
                newObjectArray = JavaVM.GetDelegateForFunctionPointer(functions.NewObjectArray, newObjectArray);
            }

            IntPtr res = newObjectArray(Env, len, classHandle, init);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public IntPtr NewIntArray(int len, IntPtr classHandle) {
            if (newIntArray == null) {
                newIntArray = JavaVM.GetDelegateForFunctionPointer(functions.NewIntArray, newIntArray);
            }

            IntPtr res = newIntArray(Env, len);

            CheckJavaExceptionAndThrow();
            return res;
        }


        public IntPtr NewLongArray(int len, IntPtr classHandle) {
            if (newLongArray == null) {
                newLongArray = JavaVM.GetDelegateForFunctionPointer(functions.NewLongArray, newLongArray);
            }

            IntPtr res = newLongArray(Env, len);

            CheckJavaExceptionAndThrow();
            return res;
        }

        public IntPtr NewCharArray(int len, IntPtr classHandle) {
            if (newCharArray == null) {
                newCharArray = JavaVM.GetDelegateForFunctionPointer(functions.NewCharArray, newCharArray);
            }

            IntPtr res = newCharArray(Env, len);

            CheckJavaExceptionAndThrow();
            return res;
        }

        public IntPtr NewShortArray(int len, IntPtr classHandle) {
            if (newShortArray == null) {
                newShortArray = JavaVM.GetDelegateForFunctionPointer(functions.NewShortArray, newShortArray);
            }

            IntPtr res = newShortArray(Env, len);

            CheckJavaExceptionAndThrow();
            return res;
        }


        public IntPtr NewDoubleArray(int len, IntPtr classHandle) {
            if (newDoubleArray == null) {
                newDoubleArray = JavaVM.GetDelegateForFunctionPointer(functions.NewDoubleArray, newDoubleArray);
            }

            IntPtr res = newDoubleArray(Env, len);

            CheckJavaExceptionAndThrow();
            return res;
        }

        public IntPtr NewFloatArray(int len, IntPtr classHandle) {
            if (newFloatArray == null) {
                newFloatArray = JavaVM.GetDelegateForFunctionPointer(functions.NewFloatArray, newFloatArray);
            }

            IntPtr res = newFloatArray(Env, len);

            CheckJavaExceptionAndThrow();
            return res;
        }

        public void SetObjectArrayElement(IntPtr array, int index, IntPtr val) {
            if (setObjectArrayElement == null) {
                setObjectArrayElement = JavaVM.GetDelegateForFunctionPointer(functions.SetObjectArrayElement, setObjectArrayElement);
            }

            setObjectArrayElement(Env, array, index, val);

            CheckJavaExceptionAndThrow();
        }

        public IntPtr NewByteArray(int len, IntPtr classHandle) {
            if (newByteArray == null) {
                newByteArray = JavaVM.GetDelegateForFunctionPointer(functions.NewByteArray, newByteArray);
            }

            IntPtr res = newByteArray(Env, len);

            CheckJavaExceptionAndThrow();
            return res;
        }

        #endregion

        #region getters instance

        public IntPtr GetObjectField(jobject obj, IntPtr fieldID) {
            if (getObjectField == null) {
                getObjectField = JavaVM.GetDelegateForFunctionPointer(functions.GetObjectField, getObjectField);
            }
            IntPtr res = getObjectField(Env, obj, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }


        public int GetArrayLength(IntPtr obj) {
            if (getArrayLength == null) {
                getArrayLength = JavaVM.GetDelegateForFunctionPointer(functions.GetArrayLength, getArrayLength);
            }
            int len = getArrayLength(Env, obj);
            CheckJavaExceptionAndThrow();
            return len;
        }

        internal jboolean[] GetBooleanArray(IntPtr obj) {
            if (getBooleanArrayElements == null) {
                getBooleanArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.GetBooleanArrayElements, getBooleanArrayElements);
            }

            if (releaseBooleanArrayElements == null) {
                releaseBooleanArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.ReleaseBooleanArrayElements, releaseBooleanArrayElements);
            }
            int len = this.GetArrayLength(obj);

            jboolean isCopy;
            jboolean* elems = getBooleanArrayElements(Env, obj, &isCopy);

            jboolean[] result = new jboolean[len];
            for (int i = 0; i < len; i++)
                result[i] = (jboolean)elems[i];

            if (isCopy == JNIBooleanValue.JNI_TRUE)
                releaseBooleanArrayElements(Env, obj, elems, JNIPrimitiveArrayReleaseMode.JNI_ABORT);

            CheckJavaExceptionAndThrow();
            return result;
        }

        internal jbyte[] GetByteArray(IntPtr obj) {
            if (getByteArrayElements == null) {
                getByteArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.GetByteArrayElements, getByteArrayElements);
            }

            if (releaseByteArrayElements == null) {
                releaseByteArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.ReleaseByteArrayElements, releaseByteArrayElements);
            }
            int len = this.GetArrayLength(obj);

            jboolean isCopy;
            jbyte* elems = getByteArrayElements(Env, obj, &isCopy);

            jbyte[] result = new jbyte[len];
            for (int i = 0; i < len; i++)
                result[i] = elems[i];

            if (isCopy == JNIBooleanValue.JNI_TRUE)
                releaseByteArrayElements(Env, obj, elems, JNIPrimitiveArrayReleaseMode.JNI_ABORT);

            CheckJavaExceptionAndThrow();
            return result;
        }

        internal jchar[] GetCharArray(IntPtr obj) {
            if (getCharArrayElements == null) {
                getCharArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.GetCharArrayElements, getCharArrayElements);
            }

            if (releaseCharArrayElements == null) {
                releaseCharArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.ReleaseCharArrayElements, releaseCharArrayElements);
            }
            int len = this.GetArrayLength(obj);

            jboolean isCopy;
            jchar* elems = getCharArrayElements(Env, obj, &isCopy);

            jchar[] result = new jchar[len];
            for (int i = 0; i < len; i++)
                result[i] = elems[i];

            if (isCopy == JNIBooleanValue.JNI_TRUE)
                releaseCharArrayElements(Env, obj, elems, JNIPrimitiveArrayReleaseMode.JNI_ABORT);

            CheckJavaExceptionAndThrow();
            return result;
        }

        internal jshort[] GetShortArray(IntPtr obj) {
            if (getShortArrayElements == null) {
                getShortArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.GetShortArrayElements, getShortArrayElements);
            }

            if (releaseShortArrayElements == null) {
                releaseShortArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.ReleaseShortArrayElements, releaseShortArrayElements);
            }
            int len = this.GetArrayLength(obj);

            jboolean isCopy;
            jshort* elems = getShortArrayElements(Env, obj, &isCopy);

            jshort[] result = new jshort[len];
            for (int i = 0; i < len; i++)
                result[i] = elems[i];

            if (isCopy == JNIBooleanValue.JNI_TRUE)
                releaseShortArrayElements(Env, obj, elems, JNIPrimitiveArrayReleaseMode.JNI_ABORT);

            CheckJavaExceptionAndThrow();
            return result;
        }

        public int[] GetIntArray(IntPtr obj) {
            if (getIntArrayElements == null) {
                getIntArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.GetIntArrayElements, getIntArrayElements);
            }

            if (releaseIntArrayElements == null) {
                releaseIntArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.ReleaseIntArrayElements, releaseIntArrayElements);
            }

            int len = this.GetArrayLength(obj);
            byte isCopy;
            int* elems = getIntArrayElements(Env, obj, &isCopy);
            int[] res = new int[len];
            for (int i = 0; i < len; i++)
                res[i] = (int)elems[i];

            if (isCopy == JNIBooleanValue.JNI_TRUE)
                releaseIntArrayElements(Env, obj, elems, JNIPrimitiveArrayReleaseMode.JNI_ABORT);

            CheckJavaExceptionAndThrow();
            return res;
        }

        internal jlong[] GetLongArray(IntPtr obj) {
            if (getLongArrayElements == null) {
                getLongArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.GetLongArrayElements, getLongArrayElements);
            }

            if (releaseLongArrayElements == null) {
                releaseLongArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.ReleaseLongArrayElements, releaseLongArrayElements);
            }
            int len = this.GetArrayLength(obj);

            jboolean isCopy;
            jlong* elems = getLongArrayElements(Env, obj, &isCopy);

            jlong[] result = new jlong[len];
            for (int i = 0; i < len; i++)
                result[i] = elems[i];

            if (isCopy == JNIBooleanValue.JNI_TRUE)
                releaseLongArrayElements(Env, obj, elems, JNIPrimitiveArrayReleaseMode.JNI_ABORT);

            CheckJavaExceptionAndThrow();
            return result;
        }

        internal jfloat[] GetFloatArray(IntPtr obj) {
            if (getFloatArrayElements == null) {
                getFloatArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.GetFloatArrayElements, getFloatArrayElements);
            }

            if (releaseFloatArrayElements == null) {
                releaseFloatArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.ReleaseFloatArrayElements, releaseFloatArrayElements);
            }
            int len = this.GetArrayLength(obj);

            jboolean isCopy;
            jfloat* elems = getFloatArrayElements(Env, obj, &isCopy);

            jfloat[] result = new jfloat[len];
            for (int i = 0; i < len; i++)
                result[i] = elems[i];

            if (isCopy == JNIBooleanValue.JNI_TRUE)
                releaseFloatArrayElements(Env, obj, elems, JNIPrimitiveArrayReleaseMode.JNI_ABORT);

            CheckJavaExceptionAndThrow();
            return result;
        }

        internal jdouble[] GetDoubleArray(IntPtr obj) {
            if (getDoubleArrayElements == null) {
                getDoubleArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.GetDoubleArrayElements, getDoubleArrayElements);
            }

            if (releaseDoubleArrayElements == null) {
                releaseDoubleArrayElements = JavaVM.GetDelegateForFunctionPointer(functions.ReleaseDoubleArrayElements, releaseDoubleArrayElements);
            }
            int len = this.GetArrayLength(obj);

            jboolean isCopy;
            jdouble* elems = getDoubleArrayElements(Env, obj, &isCopy);

            jdouble[] result = new jdouble[len];
            for (int i = 0; i < len; i++)
                result[i] = elems[i];

            if (isCopy == JNIBooleanValue.JNI_TRUE)
                releaseDoubleArrayElements(Env, obj, elems, (jint)JNIPrimitiveArrayReleaseMode.JNI_ABORT);

            CheckJavaExceptionAndThrow();
            return result;
        }

        internal IntPtr[] GetObjectArray(IntPtr obj) {
            if (getObjectArrayElement == null) {
                getObjectArrayElement = JavaVM.GetDelegateForFunctionPointer(functions.GetObjectArrayElement, getObjectArrayElement);
            }

            int len = this.GetArrayLength(obj);
            IntPtr[] result = new IntPtr[len];
            for (int i = 0; i < len; i++) {
                IntPtr res = getObjectArrayElement(Env, obj, i);
                result[i] = res;
            }

            CheckJavaExceptionAndThrow();
            return result;
        }

        public bool GetBooleanField(jobject obj, IntPtr fieldID) {
            if (getBooleanField == null) {
                getBooleanField = JavaVM.GetDelegateForFunctionPointer(functions.GetBooleanField, getBooleanField);
            }
            bool res = getBooleanField(Env, obj, fieldID) != 0;
            CheckJavaExceptionAndThrow();
            return res;
        }

        public sbyte GetByteField(jobject obj, IntPtr fieldID) {
            if (getByteField == null) {
                getByteField = JavaVM.GetDelegateForFunctionPointer(functions.GetByteField, getByteField);
            }
            sbyte res = getByteField(Env, obj, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public short GetShortField(jobject obj, IntPtr fieldID) {
            if (getShortField == null) {
                getShortField = JavaVM.GetDelegateForFunctionPointer(functions.GetShortField, getShortField);
            }
            short res = getShortField(Env, obj, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public long GetLongField(jobject obj, IntPtr fieldID) {
            if (getLongField == null) {
                getLongField = JavaVM.GetDelegateForFunctionPointer(functions.GetLongField, getLongField);
            }
            long res = getLongField(Env, obj, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public int GetIntField(jobject obj, IntPtr fieldID) {
            if (getIntField == null) {
                getIntField = JavaVM.GetDelegateForFunctionPointer(functions.GetIntField, getIntField);
            }
            int res = getIntField(Env, obj, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public double GetDoubleField(jobject obj, IntPtr fieldID) {
            if (getDoubleField == null) {
                getDoubleField = JavaVM.GetDelegateForFunctionPointer(functions.GetDoubleField, getDoubleField);
            }
            double res = getDoubleField(Env, obj, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public float GetFloatField(jobject obj, IntPtr fieldID) {
            if (getFloatField == null) {
                getFloatField = JavaVM.GetDelegateForFunctionPointer(functions.GetFloatField, getFloatField);
            }
            float res = getFloatField(Env, obj, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public char GetCharField(jobject obj, IntPtr fieldID) {
            if (getCharField == null) {
                getCharField = JavaVM.GetDelegateForFunctionPointer(functions.GetCharField, getCharField);
            }
            var res = (char)getCharField(Env, obj, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        #endregion

        #region getters static

        public IntPtr GetStaticObjectField(IntPtr clazz, IntPtr fieldID) {
            if (getStaticObjectField == null) {
                getStaticObjectField = JavaVM.GetDelegateForFunctionPointer(functions.GetStaticObjectField, getStaticObjectField);
            }
            IntPtr res = getStaticObjectField(Env, clazz, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }


        public bool GetStaticBooleanField(IntPtr clazz, IntPtr fieldID) {
            if (getStaticBooleanField == null) {
                getStaticBooleanField = JavaVM.GetDelegateForFunctionPointer(functions.GetStaticBooleanField, getStaticBooleanField);
            }
            bool res = getStaticBooleanField(Env, clazz, fieldID) != 0;
            CheckJavaExceptionAndThrow();
            return res;
        }

        public sbyte GetStaticByteField(IntPtr classHandle, IntPtr fieldID) {
            if (getStaticByteField == null) {
                getStaticByteField = JavaVM.GetDelegateForFunctionPointer(functions.GetStaticByteField, getStaticByteField);
            }
            sbyte res = getStaticByteField(Env, classHandle, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public short GetStaticShortField(IntPtr classHandle, IntPtr fieldID) {
            if (getStaticShortField == null) {
                getStaticShortField = JavaVM.GetDelegateForFunctionPointer(functions.GetStaticShortField, getStaticShortField);
            }
            short res = getStaticShortField(Env, classHandle, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public long GetStaticLongField(IntPtr classHandle, IntPtr fieldID) {
            if (getStaticLongField == null) {
                getStaticLongField = JavaVM.GetDelegateForFunctionPointer(functions.GetStaticLongField, getStaticLongField);
            }
            long res = getStaticLongField(Env, classHandle, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public int GetStaticIntField(IntPtr classHandle, IntPtr fieldID) {
            if (getStaticIntField == null) {
                getStaticIntField = JavaVM.GetDelegateForFunctionPointer(functions.GetStaticIntField, getStaticIntField);
            }
            int res = getStaticIntField(Env, classHandle, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public double GetStaticDoubleField(IntPtr classHandle, IntPtr fieldID) {
            if (getStaticDoubleField == null) {
                getStaticDoubleField = JavaVM.GetDelegateForFunctionPointer(functions.GetStaticDoubleField, getStaticDoubleField);
            }
            double res = getStaticDoubleField(Env, classHandle, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public float GetStaticFloatField(IntPtr classHandle, IntPtr fieldID) {
            if (getStaticFloatField == null) {
                getStaticFloatField = JavaVM.GetDelegateForFunctionPointer(functions.GetStaticFloatField, getStaticFloatField);
            }
            float res = getStaticFloatField(Env, classHandle, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public char GetStaticCharField(IntPtr classHandle, IntPtr fieldID) {
            if (getStaticCharField == null) {
                getStaticCharField = JavaVM.GetDelegateForFunctionPointer(functions.GetStaticCharField, getStaticCharField);
            }
            var res = (char)getStaticCharField(Env, classHandle, fieldID);
            CheckJavaExceptionAndThrow();
            return res;
        }

        #endregion

        #region setters instance

        internal void SetObjectField(jobject obj, IntPtr fieldID, IntPtr value) {
            if (setObjectField == null) {
                setObjectField = JavaVM.GetDelegateForFunctionPointer(functions.SetObjectField, setObjectField);
            }
            setObjectField(Env, obj, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetIntField(jobject obj, IntPtr fieldID, int value) {
            if (setIntField == null) {
                setIntField = JavaVM.GetDelegateForFunctionPointer(functions.SetIntField, setIntField);
            }
            setIntField(Env, obj, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetBooleanField(jobject obj, IntPtr fieldID, bool value) {
            if (setBooleanField == null) {
                setBooleanField = JavaVM.GetDelegateForFunctionPointer(functions.SetBooleanField, setBooleanField);
            }
            setBooleanField(Env, obj, fieldID, JavaVM.BooleanToByte(value));
            CheckJavaExceptionAndThrow();
        }

        internal void SetByteField(jobject obj, IntPtr fieldID, sbyte value) {
            if (setByteField == null) {
                setByteField = JavaVM.GetDelegateForFunctionPointer(functions.SetByteField, setByteField);
            }
            setByteField(Env, obj, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetCharField(jobject obj, IntPtr fieldID, char value) {
            if (setCharField == null) {
                setCharField = JavaVM.GetDelegateForFunctionPointer(functions.SetCharField, setCharField);
            }
            setCharField(Env, obj, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetShortField(jobject obj, IntPtr fieldID, short value) {
            if (setShortField == null) {
                setShortField = JavaVM.GetDelegateForFunctionPointer(functions.SetShortField, setShortField);
            }
            setShortField(Env, obj, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetLongField(jobject obj, IntPtr fieldID, long value) {
            if (setLongField == null) {
                setLongField = JavaVM.GetDelegateForFunctionPointer(functions.SetLongField, setLongField);
            }
            setLongField(Env, obj, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetFloatField(jobject obj, IntPtr fieldID, float value) {
            if (setFloatField == null) {
                setFloatField = JavaVM.GetDelegateForFunctionPointer(functions.SetFloatField, setFloatField);
            }
            setFloatField(Env, obj, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetDoubleField(jobject obj, IntPtr fieldID, double value) {
            if (setDoubleField == null) {
                setDoubleField = JavaVM.GetDelegateForFunctionPointer(functions.SetDoubleField, setDoubleField);
            }
            setDoubleField(Env, obj, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        # endregion

        #region setters static

        internal void SetStaticObjectField(IntPtr classHandle, IntPtr fieldID, IntPtr value) {
            if (setStaticObjectField == null) {
                setStaticObjectField = JavaVM.GetDelegateForFunctionPointer(functions.SetStaticObjectField, setStaticObjectField);
            }
            setStaticObjectField(Env, classHandle, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetStaticIntField(IntPtr classHandle, IntPtr fieldID, int value) {
            if (setStaticIntField == null) {
                setStaticIntField = JavaVM.GetDelegateForFunctionPointer(functions.SetStaticIntField, setStaticIntField);
            }
            setStaticIntField(Env, classHandle, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetStaticBooleanField(IntPtr classHandle, IntPtr fieldID, bool value) {
            if (setStaticBooleanField == null) {
                setStaticBooleanField = JavaVM.GetDelegateForFunctionPointer(functions.SetStaticBooleanField, setStaticBooleanField);
            }
            setStaticBooleanField(Env, classHandle, fieldID, JavaVM.BooleanToByte(value));
            CheckJavaExceptionAndThrow();
        }

        internal void SetStaticByteField(IntPtr classHandle, IntPtr fieldID, sbyte value) {
            if (setStaticByteField == null) {
                setStaticByteField = JavaVM.GetDelegateForFunctionPointer(functions.SetStaticByteField, setStaticByteField);
            }
            setStaticByteField(Env, classHandle, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetStaticCharField(IntPtr classHandle, IntPtr fieldID, char value) {
            if (setStaticCharField == null) {
                setStaticCharField = JavaVM.GetDelegateForFunctionPointer(functions.SetStaticCharField, setStaticCharField);
            }
            setStaticCharField(Env, classHandle, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetStaticShortField(IntPtr classHandle, IntPtr fieldID, short value) {
            if (setStaticShortField == null) {
                setStaticShortField = JavaVM.GetDelegateForFunctionPointer(functions.SetStaticShortField, setStaticShortField);
            }
            setStaticShortField(Env, classHandle, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetStaticLongField(IntPtr classHandle, IntPtr fieldID, long value) {
            if (setStaticLongField == null) {
                setStaticLongField = JavaVM.GetDelegateForFunctionPointer(functions.SetStaticLongField, setStaticLongField);
            }
            setStaticLongField(Env, classHandle, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetStaticFloatField(IntPtr classHandle, IntPtr fieldID, float value) {
            if (setStaticFloatField == null) {
                setStaticFloatField = JavaVM.GetDelegateForFunctionPointer(functions.SetStaticFloatField, setStaticFloatField);
            }
            setStaticFloatField(Env, classHandle, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        internal void SetStaticDoubleField(IntPtr classHandle, IntPtr fieldID, double value) {
            if (setStaticDoubleField == null) {
                setStaticDoubleField = JavaVM.GetDelegateForFunctionPointer(functions.SetStaticDoubleField, setStaticDoubleField);
            }
            setStaticDoubleField(Env, classHandle, fieldID, value);
            CheckJavaExceptionAndThrow();
        }

        #endregion

        #region string methods

        public IntPtr NewString(String unicode, int len) {
            if (newString == null) {
                newString = JavaVM.GetDelegateForFunctionPointer(functions.NewString, newString);
            }
            IntPtr res = newString(Env, unicode, len);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public IntPtr NewStringUFT(IntPtr UFT) {
            if (newStringUTF == null) {
                newStringUTF = JavaVM.GetDelegateForFunctionPointer(functions.NewStringUTF, newStringUTF);
            }
            IntPtr res = newStringUTF(Env, UFT);
            CheckJavaExceptionAndThrow();
            return res;
        }

        internal IntPtr GetStringChars(IntPtr JStr, byte* b) {
            if (getStringChars == null) {
                getStringChars = JavaVM.GetDelegateForFunctionPointer(functions.GetStringChars, getStringChars);
            }
            IntPtr res = getStringChars(Env, JStr, b);
            CheckJavaExceptionAndThrow();
            return res;
        }

        internal void ReleaseStringChars(IntPtr JStr, IntPtr chars) {
            if (releaseStringChars == null) {
                releaseStringChars = JavaVM.GetDelegateForFunctionPointer(functions.ReleaseStringChars, releaseStringChars);
            }
            releaseStringChars(Env, JStr, chars);
            CheckJavaExceptionAndThrow();
        }

        internal sbyte[] JStringToByte(IntPtr JStr) {
            if (JStr != null) {
                return GetByteArray(JStr);
            } else return null;
        }

        internal string JStringToString(IntPtr JStr) {
            if (JStr != null) {
                byte b;
                IntPtr chars = GetStringChars(JStr, &b);
                string result = Marshal.PtrToStringUni(chars);
                ReleaseStringChars(JStr, chars);
                return result;
            } else return null;
        }

        #endregion

        #region buffer  -- I can not see any reason why these would be used

        public IntPtr NewDirectByteBuffer(IntPtr address, long capacity) {
            if (newDirectByteBuffer == null) {
                newDirectByteBuffer = JavaVM.GetDelegateForFunctionPointer(functions.NewDirectByteBuffer, newDirectByteBuffer);
            }
            IntPtr res = newDirectByteBuffer.Invoke(Env, address, capacity);
            CheckJavaExceptionAndThrow();
            return res;
        }



        public IntPtr GetDirectBufferAddress(IntPtr buf) {
            if (getDirectBufferAddress == null) {
                getDirectBufferAddress = JavaVM.GetDelegateForFunctionPointer(functions.GetDirectBufferAddress, getDirectBufferAddress);
            }
            IntPtr res = getDirectBufferAddress.Invoke(Env, buf);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public long GetDirectBufferCapacity(IntPtr buf) {
            if (getDirectBufferCapacity == null) {
                getDirectBufferCapacity = JavaVM.GetDelegateForFunctionPointer(functions.GetDirectBufferCapacity, getDirectBufferCapacity);
            }
            long res = getDirectBufferCapacity.Invoke(Env, buf);
            CheckJavaExceptionAndThrow();
            return res;
        }

        #endregion

        #region references

        public IntPtr NewGlobalRef(IntPtr objectHandle) {
            if (newGlobalRef == null) {
                newGlobalRef = JavaVM.GetDelegateForFunctionPointer(functions.NewGlobalRef, newGlobalRef);
            }
            if (objectHandle != null) {
                IntPtr res = newGlobalRef(Env, objectHandle);
                return res;
            } else return System.IntPtr.Zero;
        }

        internal IntPtr NewLocalRef(IntPtr objectHandle) {
            if (newLocalRef == null) {
                newLocalRef = JavaVM.GetDelegateForFunctionPointer(functions.NewLocalRef, newLocalRef);
            }
            if (objectHandle != null) {
                IntPtr res = newLocalRef(Env, objectHandle);
                return res;
            } else return System.IntPtr.Zero;
        }

        internal IntPtr PopLocalFrame(IntPtr result) {
            if (popLocalFrame == null) {
                popLocalFrame = JavaVM.GetDelegateForFunctionPointer(functions.PopLocalFrame, popLocalFrame);
            }
            IntPtr res = popLocalFrame(Env, result);
            CheckJavaExceptionAndThrow();
            return res;
        }

        internal int PushLocalFrame(int capacity) {
            if (pushLocalFrame == null) {
                pushLocalFrame = JavaVM.GetDelegateForFunctionPointer(functions.PushLocalFrame, pushLocalFrame);
            }
            int res = pushLocalFrame(Env, capacity);
            CheckJavaExceptionAndThrow();
            return res;
        }

        internal int EnsureLocalCapacity(int capacity) {
            if (ensureLocalCapacity == null) {
                ensureLocalCapacity = JavaVM.GetDelegateForFunctionPointer(functions.EnsureLocalCapacity, ensureLocalCapacity);
            }
            int res = ensureLocalCapacity(Env, capacity);
            CheckJavaExceptionAndThrow();
            return res;
        }

        internal void DeleteGlobalRef(IntPtr objectHandle) {
            if (deleteGlobalRef == null) {
                deleteGlobalRef = JavaVM.GetDelegateForFunctionPointer(functions.DeleteGlobalRef, deleteGlobalRef);
            }
            if (objectHandle != null) {
                deleteGlobalRef(Env, objectHandle);
            }
        }

        internal void DeleteLocalRef(IntPtr objectHandle) {
            if (deleteLocalRef == null) {
                deleteLocalRef = JavaVM.GetDelegateForFunctionPointer(functions.DeleteLocalRef, deleteLocalRef);
            }
            if (objectHandle != null) {
                deleteLocalRef(Env, objectHandle);
            }
        }

        #endregion

        #region exceptions

        public jthrowable ExceptionOccurred() {
            if (exceptionOccurred == null) {
                exceptionOccurred = JavaVM.GetDelegateForFunctionPointer(functions.ExceptionOccurred, exceptionOccurred);
            }
            IntPtr res = exceptionOccurred(Env);

            return res;
        }

        public void FatalError(string message) {
            if (fatalError == null) {
                fatalError = JavaVM.GetDelegateForFunctionPointer(functions.FatalError, fatalError);
            }
            fatalError(Env, Marshal.StringToHGlobalUni(message));
        }

        public void ExceptionClear() {
            if (exceptionClear == null) {
                exceptionClear = JavaVM.GetDelegateForFunctionPointer(functions.ExceptionClear, exceptionClear);
            }
            exceptionClear(Env);
        }

        public void ExceptionDescribe() {
            if (exceptionDescribe == null) {
                exceptionDescribe = JavaVM.GetDelegateForFunctionPointer(functions.ExceptionDescribe, exceptionDescribe);
            }
            exceptionDescribe(Env);
        }

        internal void Throw(IntPtr objectHandle) {
            if (_throw == null) {
                _throw = JavaVM.GetDelegateForFunctionPointer(functions.Throw, _throw);
            }
            int iResult = _throw(Env, objectHandle);
            if (iResult != JNIReturnValue.JNI_OK) {
                throw new Exception("Can't throw");
            }
        }

        public void ThrowNew(IntPtr classHandle, string message) {
            if (throwNew == null) {
                throwNew = JavaVM.GetDelegateForFunctionPointer(functions.ThrowNew, throwNew);
            }
            IntPtr uni = Marshal.StringToHGlobalUni(message);
            int iResult = throwNew(Env, classHandle, uni);
            if (iResult != JNIReturnValue.JNI_OK) {
                throw new Exception("Can't throw");
            }
            Marshal.FreeHGlobal(uni);
        }

        public Exception CatchJavaException(bool fullstacktrace = false) {
            jthrowable occurred = ExceptionOccurred();
            if (occurred != null && occurred != IntPtr.Zero) {
                ExceptionClear();
                jclass ExceptionClass = this.GetObjectClass(occurred);
                // TODO : if full stack trace requested, use 
                // StringWriter sw = new StringWriter();
                // PrintWriter pw = new PrintWriter(sw);
                // e.printStackTrace(pw);
                // sw.toString()
                // Note : there seems to be a new stack walking API since java 9 : https://www.baeldung.com/java-9-stackwalking-api
                jmethodID mid = GetMethodID(ExceptionClass, "toString", "()Ljava/lang/String;");
                IntPtr jstr = CallObjectMethod(occurred, mid, new JValue() { });
                
                return new Exception(JStringToString(jstr));
            }
            return null;
        }

        /// <summary>
        /// Check if an exception has occured and throw back a simple exception to stop execution.<br/>
        /// For now, java exception details needs to be retrieved by CatchJavaException
        /// after catching this exception.<br/>
        /// In the future, it might be simpler to directly throw back the java exception when it occurs
        /// </summary>
        /// <returns></returns>
        public unsafe bool CheckJavaExceptionAndThrow() {
            if (exceptionCheck == null) {
                exceptionCheck = JavaVM.GetDelegateForFunctionPointer(functions.ExceptionCheck, exceptionCheck);
            }
            if (exceptionCheck(Env) != 0) {
                jthrowable occurred = ExceptionOccurred();
                if (occurred != null && occurred != IntPtr.Zero) {
                    ExceptionClear();
                    jclass ExceptionClass = this.GetObjectClass(occurred);
                    
                    // TODO : if full stack trace requested, use 
                    // StringWriter sw = new StringWriter();
                    // PrintWriter pw = new PrintWriter(sw);
                    // e.printStackTrace(pw);
                    // sw.toString()
                    // Note : there seems to be a new stack walking API since java 9 : https://www.baeldung.com/java-9-stackwalking-api
                    jmethodID ExceptionToString = GetMethodID(ExceptionClass, "toString", "()Ljava/lang/String;");
                    jmethodID GetExceptionCause = GetMethodID(ExceptionClass, "getCause", "()Ljava/lang/Throwable;");
                    jstring exceptionString = CallObjectMethod(occurred, ExceptionToString, new JValue() { });
                    Stack<string> exceptionStack = new Stack<string>();
                    exceptionStack.Push(JStringToString(exceptionString));

                    jclass ThrowableClass = this.FindClass("java/lang/Throwable");
                    jmethodID GetThrowableCause = GetMethodID(ThrowableClass, "getCause", "()Ljava/lang/Throwable;");
                    jmethodID ThorwableToString = GetMethodID(ThrowableClass, "toString", "()Ljava/lang/String;");

                    jthrowable cause = CallObjectMethod(occurred, GetExceptionCause, new JValue() { });
                    while (cause != IntPtr.Zero) {
                        jstring causeString = CallObjectMethod(cause, ThorwableToString, new JValue() { });
                        exceptionStack.Push(JStringToString(causeString));
                        cause = CallObjectMethod(cause, GetThrowableCause, new JValue() { });
                    }
                    Exception current = null;
                    while (exceptionStack.Count > 0) {
                        current = new Exception(exceptionStack.Pop(), current);
                    }
                    if(current == null) throw new Exception("Unknown exception raised by JNI");
                    else throw current;
                } else {
                    throw new Exception("Unknown exception raised by JNI");
                }
            }
            return exceptionCheck(Env) != 0;
        }

        #endregion

        #region HelperMethods

        internal void PackPrimitiveArray<T>(T[] sourceArray, IntPtr pointerToArray) {
            byte isCopy = 0;
            byte[] byteArray = new byte[sourceArray.Length * Marshal.SizeOf(typeof(T))];
            Buffer.BlockCopy(sourceArray, 0, byteArray, 0, sourceArray.Length * Marshal.SizeOf(typeof(T)));
            byte* pb = (byte*)this.GetPrimitiveArrayCritical(pointerToArray, &isCopy);
            if (pb == null) {
                throw new Exception("An error occurred whilst packing the array.");
            }
            try {
                Marshal.Copy(byteArray, 0, (new IntPtr(pb)), sourceArray.Length * Marshal.SizeOf(typeof(T)));
            } finally {
                this.ReleasePrimitiveArrayCritical(pointerToArray, pb, 0);
            }
        }

        internal void ReleasePrimitiveArrayCritical(IntPtr array, void* carray, int mode) {
            if (releasePrimitiveArrayCritical == null) {
                releasePrimitiveArrayCritical = JavaVM.GetDelegateForFunctionPointer(functions.ReleasePrimitiveArrayCritical, releasePrimitiveArrayCritical);
            }
            releasePrimitiveArrayCritical(Env, array, carray, mode);
            CheckJavaExceptionAndThrow();
        }

        internal void* GetPrimitiveArrayCritical(IntPtr array, byte* isCopy) {
            if (getPrimitiveArrayCritical == null) {
                getPrimitiveArrayCritical = JavaVM.GetDelegateForFunctionPointer(functions.GetPrimitiveArrayCritical, getPrimitiveArrayCritical);
            }
            var res = getPrimitiveArrayCritical(Env, array, isCopy);
            CheckJavaExceptionAndThrow();
            return res;
        }

        public IntPtr GetStringCritical(jstring _string, jboolean* isCopy) {
            if (getStringCritical == null) {
                getStringCritical = JavaVM.GetDelegateForFunctionPointer(functions.GetStringCritical, getStringCritical);
            }
            IntPtr res = getStringCritical.Invoke(Env, _string, isCopy);
            CheckJavaExceptionAndThrow();
            return res;
        }




        #endregion
        #region Nested type: Delegates

        private JNINativeInterface_.AllocObject? allocObject;
        private JNINativeInterface_.CallBooleanMethod? callBooleanMethod;
        private JNINativeInterface_.CallByteMethod? callByteMethod;
        private JNINativeInterface_.CallCharMethod? callCharMethod;
        private JNINativeInterface_.CallDoubleMethod? callDoubleMethod;
        private JNINativeInterface_.CallFloatMethod? callFloatMethod;
        private JNINativeInterface_.CallIntMethod? callIntMethod;
        private JNINativeInterface_.CallLongMethod? callLongMethod;
        private JNINativeInterface_.CallVoidMethod? callVoidMethod;

        private JNINativeInterface_.CallNonvirtualBooleanMethod? callNonvirtualBooleanMethod;
        private JNINativeInterface_.CallNonvirtualByteMethod? callNonvirtualByteMethod;
        private JNINativeInterface_.CallNonvirtualCharMethod? callNonvirtualCharMethod;
        private JNINativeInterface_.CallNonvirtualDoubleMethod? callNonvirtualDoubleMethod;
        private JNINativeInterface_.CallNonvirtualFloatMethod? callNonvirtualFloatMethod;
        private JNINativeInterface_.CallNonvirtualIntMethod? callNonvirtualIntMethod;
        private JNINativeInterface_.CallNonvirtualLongMethod? callNonvirtualLongMethod;
        private JNINativeInterface_.CallNonvirtualObjectMethod? callNonvirtualObjectMethod;
        private JNINativeInterface_.CallNonvirtualShortMethod? callNonvirtualShortMethod;
        private JNINativeInterface_.CallNonvirtualVoidMethod? callNonvirtualVoidMethod;
        private JNINativeInterface_.CallObjectMethod? callObjectMethod;
        private JNINativeInterface_.CallShortMethod? callShortMethod;
        private JNINativeInterface_.CallStaticBooleanMethod? callStaticBooleanMethod;
        private JNINativeInterface_.CallStaticByteMethod? callStaticByteMethod;
        private JNINativeInterface_.CallStaticCharMethod? callStaticCharMethod;
        private JNINativeInterface_.CallStaticDoubleMethod? callStaticDoubleMethod;
        private JNINativeInterface_.CallStaticFloatMethod? callStaticFloatMethod;
        private JNINativeInterface_.CallStaticIntMethod? callStaticIntMethod;
        private JNINativeInterface_.CallStaticLongMethod? callStaticLongMethod;
        private JNINativeInterface_.CallStaticObjectMethod? callStaticObjectMethod;
        private JNINativeInterface_.CallStaticShortMethod? callStaticShortMethod;
        private JNINativeInterface_.CallStaticVoidMethod? callStaticVoidMethod;

        private JNINativeInterface_.DefineClass? defineClass;
        private JNINativeInterface_.DeleteGlobalRef? deleteGlobalRef;
        private JNINativeInterface_.DeleteLocalRef? deleteLocalRef;
        private JNINativeInterface_.DeleteWeakGlobalRef? deleteWeakGlobalRef;
        private JNINativeInterface_.EnsureLocalCapacity? ensureLocalCapacity;
        private JNINativeInterface_.ExceptionCheck? exceptionCheck;
        private JNINativeInterface_.ExceptionClear? exceptionClear;
        private JNINativeInterface_.ExceptionDescribe? exceptionDescribe;
        private JNINativeInterface_.ExceptionOccurred? exceptionOccurred;
        private JNINativeInterface_.FatalError? fatalError;
        private JNINativeInterface_.FindClass? findClass;
        private JNINativeInterface_.FromReflectedField? fromReflectedField;
        private JNINativeInterface_.FromReflectedMethod? fromReflectedMethod;
        private JNINativeInterface_.GetArrayLength? getArrayLength;
        private JNINativeInterface_.GetBooleanArrayElements? getBooleanArrayElements;
        private JNINativeInterface_.GetBooleanArrayRegion? getBooleanArrayRegion;
        private JNINativeInterface_.GetBooleanField? getBooleanField;
        private JNINativeInterface_.GetByteArrayElements? getByteArrayElements;
        private JNINativeInterface_.GetByteArrayRegion? getByteArrayRegion;
        private JNINativeInterface_.GetByteField? getByteField;
        private JNINativeInterface_.GetCharArrayElements? getCharArrayElements;
        private JNINativeInterface_.GetCharArrayRegion? getCharArrayRegion;
        private JNINativeInterface_.GetCharField? getCharField;
        private JNINativeInterface_.GetDirectBufferAddress? getDirectBufferAddress;
        private JNINativeInterface_.GetDirectBufferCapacity? getDirectBufferCapacity;
        private JNINativeInterface_.GetDoubleArrayElements? getDoubleArrayElements;
        private JNINativeInterface_.GetDoubleArrayRegion? getDoubleArrayRegion;
        private JNINativeInterface_.GetDoubleField? getDoubleField;
        private JNINativeInterface_.GetFieldID? getFieldID;
        private JNINativeInterface_.GetFloatArrayElements? getFloatArrayElements;
        private JNINativeInterface_.GetFloatArrayRegion? getFloatArrayRegion;
        private JNINativeInterface_.GetFloatField? getFloatField;
        private JNINativeInterface_.GetIntArrayElements? getIntArrayElements;
        private JNINativeInterface_.GetIntArrayRegion? getIntArrayRegion;
        private JNINativeInterface_.GetIntField? getIntField;
        private JNINativeInterface_.GetJavaVM? getJavaVM;
        private JNINativeInterface_.GetLongArrayElements? getLongArrayElements;
        private JNINativeInterface_.GetLongArrayRegion? getLongArrayRegion;
        private JNINativeInterface_.GetLongField? getLongField;
        private JNINativeInterface_.GetMethodID? getMethodID;
        private JNINativeInterface_.GetObjectArrayElement? getObjectArrayElement;
        private JNINativeInterface_.GetObjectClass? getObjectClass;
        private JNINativeInterface_.GetObjectField? getObjectField;
        private JNINativeInterface_.GetPrimitiveArrayCritical? getPrimitiveArrayCritical;
        private JNINativeInterface_.GetShortArrayElements? getShortArrayElements;
        private JNINativeInterface_.GetShortArrayRegion? getShortArrayRegion;
        private JNINativeInterface_.GetShortField? getShortField;
        private JNINativeInterface_.GetStaticBooleanField? getStaticBooleanField;
        private JNINativeInterface_.GetStaticByteField? getStaticByteField;
        private JNINativeInterface_.GetStaticCharField? getStaticCharField;
        private JNINativeInterface_.GetStaticDoubleField? getStaticDoubleField;
        private JNINativeInterface_.GetStaticFieldID? getStaticFieldID;
        private JNINativeInterface_.GetStaticFloatField? getStaticFloatField;
        private JNINativeInterface_.GetStaticIntField? getStaticIntField;
        private JNINativeInterface_.GetStaticLongField? getStaticLongField;
        private JNINativeInterface_.GetStaticmethodID? getStaticmethodID;
        private JNINativeInterface_.GetStaticObjectField? getStaticObjectField;
        private JNINativeInterface_.GetStaticShortField? getStaticShortField;
        private JNINativeInterface_.GetStringChars? getStringChars;
        private JNINativeInterface_.GetStringCritical? getStringCritical;
        private JNINativeInterface_.GetStringLength? getStringLength;
        private JNINativeInterface_.GetStringRegion? getStringRegion;
        private JNINativeInterface_.GetStringUTFChars? getStringUTFChars;
        private JNINativeInterface_.GetStringUTFLength? getStringUTFLength;
        private JNINativeInterface_.GetStringUTFRegion? getStringUTFRegion;
        private JNINativeInterface_.GetSuperclass? getSuperclass;
        private JNINativeInterface_.GetVersion? getVersion;
        private JNINativeInterface_.IsAssignableFrom? isAssignableFrom;
        private JNINativeInterface_.IsSameObject? isSameObject;
        private JNINativeInterface_.MonitorEnter? monitorEnter;
        private JNINativeInterface_.MonitorExit? monitorExit;
        private JNINativeInterface_.NewBooleanArray? newBooleanArray;
        private JNINativeInterface_.NewByteArray? newByteArray;
        private JNINativeInterface_.NewCharArray? newCharArray;
        private JNINativeInterface_.NewDirectByteBuffer? newDirectByteBuffer;
        private JNINativeInterface_.NewDoubleArray? newDoubleArray;
        private JNINativeInterface_.NewFloatArray? newFloatArray;
        private JNINativeInterface_.NewGlobalRef? newGlobalRef;
        private JNINativeInterface_.NewIntArray? newIntArray;
        private JNINativeInterface_.NewLocalRef? newLocalRef;
        private JNINativeInterface_.NewLongArray? newLongArray;
        private JNINativeInterface_.NewObject? newObject;
        private JNINativeInterface_.NewObjectArray? newObjectArray;
        private JNINativeInterface_.NewShortArray? newShortArray;
        private JNINativeInterface_.NewString? newString;
        private JNINativeInterface_.NewStringUTF? newStringUTF;
        private JNINativeInterface_.NewWeakGlobalRef? newWeakGlobalRef;
        private JNINativeInterface_.PopLocalFrame? popLocalFrame;
        private JNINativeInterface_.PushLocalFrame? pushLocalFrame;
        private JNINativeInterface_.RegisterNatives? registerNatives;
        private JNINativeInterface_.UnregisterNatives? unregisterNatives;
        private JNINativeInterface_.ReleaseBooleanArrayElements? releaseBooleanArrayElements;
        private JNINativeInterface_.ReleaseByteArrayElements? releaseByteArrayElements;
        private JNINativeInterface_.ReleaseCharArrayElements? releaseCharArrayElements;
        private JNINativeInterface_.ReleaseDoubleArrayElements? releaseDoubleArrayElements;
        private JNINativeInterface_.ReleaseFloatArrayElements? releaseFloatArrayElements;
        private JNINativeInterface_.ReleaseIntArrayElements? releaseIntArrayElements;
        private JNINativeInterface_.ReleaseLongArrayElements? releaseLongArrayElements;
        private JNINativeInterface_.ReleasePrimitiveArrayCritical? releasePrimitiveArrayCritical;
        private JNINativeInterface_.ReleaseShortArrayElements? releaseShortArrayElements;
        private JNINativeInterface_.ReleaseStringChars? releaseStringChars;
        private JNINativeInterface_.ReleaseStringCritical? releaseStringCritical;
        private JNINativeInterface_.ReleaseStringUTFChars? releaseStringUTFChars;
        private JNINativeInterface_.SetBooleanArrayRegion? setBooleanArrayRegion;
        private JNINativeInterface_.SetBooleanField? setBooleanField;
        private JNINativeInterface_.SetByteArrayRegion? setByteArrayRegion;
        private JNINativeInterface_.SetByteField? setByteField;
        private JNINativeInterface_.SetCharArrayRegion? setCharArrayRegion;
        private JNINativeInterface_.SetCharField? setCharField;
        private JNINativeInterface_.SetDoubleArrayRegion? setDoubleArrayRegion;
        private JNINativeInterface_.SetDoubleField? setDoubleField;
        private JNINativeInterface_.SetFloatArrayRegion? setFloatArrayRegion;
        private JNINativeInterface_.SetFloatField? setFloatField;
        private JNINativeInterface_.SetIntArrayRegion? setIntArrayRegion;
        private JNINativeInterface_.SetIntField? setIntField;
        private JNINativeInterface_.SetLongArrayRegion? setLongArrayRegion;
        private JNINativeInterface_.SetLongField? setLongField;
        private JNINativeInterface_.SetObjectArrayElement? setObjectArrayElement;
        private JNINativeInterface_.SetObjectField? setObjectField;
        private JNINativeInterface_.SetShortArrayRegion? setShortArrayRegion;
        private JNINativeInterface_.SetShortField? setShortField;
        private JNINativeInterface_.SetStaticBooleanField? setStaticBooleanField;
        private JNINativeInterface_.SetStaticByteField? setStaticByteField;
        private JNINativeInterface_.SetStaticCharField? setStaticCharField;
        private JNINativeInterface_.SetStaticDoubleField? setStaticDoubleField;
        private JNINativeInterface_.SetStaticFloatField? setStaticFloatField;
        private JNINativeInterface_.SetStaticIntField? setStaticIntField;
        private JNINativeInterface_.SetStaticLongField? setStaticLongField;
        private JNINativeInterface_.SetStaticObjectField? setStaticObjectField;
        private JNINativeInterface_.SetStaticShortField? setStaticShortField;
        private JNINativeInterface_.Throw? _throw;
        private JNINativeInterface_.ThrowNew? throwNew;
        private JNINativeInterface_.ToReflectedField? toReflectedField;
        private JNINativeInterface_.ToReflectedMethod? toReflectedMethod;

        // JDK 1.6
        private JNINativeInterface_.GetObjectRefType? getObjectRefType;
        // Modules
        private JNINativeInterface_.GetModule? getModule;


        #endregion
        private struct JNINativeInterfacePtr {
            public JNINativeInterface* functions;
        }

        public void Dispose() {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing) {
            if (disposing) {
                // free managed resources
                if (javaVM != null) {
                    javaVM.Dispose();
                    javaVM = null;
                }
            }
        }
    }

    /// <summary>
    /// Top level structure to store delegation
    /// </summary>
    public struct JNINativeInterface {
        public IntPtr reserved0;
        public IntPtr reserved1;
        public IntPtr reserved2;
        public IntPtr reserved3;
        public IntPtr GetVersion;
        public IntPtr DefineClass;
        public IntPtr FindClass;
        // Reflection support
        public IntPtr FromReflectedMethod;
        public IntPtr FromReflectedField;
        public IntPtr ToReflectedMethod;

        public IntPtr GetSuperclass;
        public IntPtr IsAssignableFrom;
        // Reflection support
        public IntPtr ToReflectedField;

        public IntPtr Throw;
        public IntPtr ThrowNew;
        public IntPtr ExceptionOccurred;
        public IntPtr ExceptionDescribe;
        public IntPtr ExceptionClear;
        public IntPtr FatalError;

        // Local Reference Management
        public IntPtr PushLocalFrame;
        public IntPtr PopLocalFrame;

        public IntPtr NewGlobalRef;
        public IntPtr DeleteGlobalRef;
        public IntPtr DeleteLocalRef;
        public IntPtr IsSameObject;
        public IntPtr NewLocalRef;
        public IntPtr EnsureLocalCapacity;
        public IntPtr AllocObject;

        public IntPtr NewObject;
        public IntPtr NewObjectV;
        public IntPtr NewObjectA;

        public IntPtr GetObjectClass;
        public IntPtr IsInstanceOf;
        public IntPtr GetMethodID;
        public IntPtr CallObjectMethod;
        public IntPtr CallObjectMethodV;
        public IntPtr CallObjectMethodA;
        public IntPtr CallBooleanMethod;
        public IntPtr CallBooleanMethodV;
        public IntPtr CallBooleanMethodA;
        public IntPtr CallByteMethod;
        public IntPtr CallByteMethodV;
        public IntPtr CallByteMethodA;
        public IntPtr CallCharMethod;
        public IntPtr CallCharMethodV;
        public IntPtr CallCharMethodA;
        public IntPtr CallShortMethod;
        public IntPtr CallShortMethodV;
        public IntPtr CallShortMethodA;
        public IntPtr CallIntMethod;
        public IntPtr CallIntMethodV;
        public IntPtr CallIntMethodA;
        public IntPtr CallLongMethod;
        public IntPtr CallLongMethodV;
        public IntPtr CallLongMethodA;
        public IntPtr CallFloatMethod;
        public IntPtr CallFloatMethodV;
        public IntPtr CallFloatMethodA;
        public IntPtr CallDoubleMethod;
        public IntPtr CallDoubleMethodV;
        public IntPtr CallDoubleMethodA;
        public IntPtr CallVoidMethod;
        public IntPtr CallVoidMethodV;
        public IntPtr CallVoidMethodA;
        public IntPtr CallNonvirtualObjectMethod;
        public IntPtr CallNonvirtualObjectMethodV;
        public IntPtr CallNonvirtualObjectMethodA;
        public IntPtr CallNonvirtualBooleanMethod;
        public IntPtr CallNonvirtualBooleanMethodV;
        public IntPtr CallNonvirtualBooleanMethodA;
        public IntPtr CallNonvirtualByteMethod;
        public IntPtr CallNonvirtualByteMethodV;
        public IntPtr CallNonvirtualByteMethodA;
        public IntPtr CallNonvirtualCharMethod;
        public IntPtr CallNonvirtualCharMethodV;
        public IntPtr CallNonvirtualCharMethodA;
        public IntPtr CallNonvirtualShortMethod;
        public IntPtr CallNonvirtualShortMethodV;
        public IntPtr CallNonvirtualShortMethodA;
        public IntPtr CallNonvirtualIntMethod;
        public IntPtr CallNonvirtualIntMethodV;
        public IntPtr CallNonvirtualIntMethodA;
        public IntPtr CallNonvirtualLongMethod;
        public IntPtr CallNonvirtualLongMethodV;
        public IntPtr CallNonvirtualLongMethodA;
        public IntPtr CallNonvirtualFloatMethod;
        public IntPtr CallNonvirtualFloatMethodV;
        public IntPtr CallNonvirtualFloatMethodA;
        public IntPtr CallNonvirtualDoubleMethod;
        public IntPtr CallNonvirtualDoubleMethodV;
        public IntPtr CallNonvirtualDoubleMethodA;
        public IntPtr CallNonvirtualVoidMethod;
        public IntPtr CallNonvirtualVoidMethodV;
        public IntPtr CallNonvirtualVoidMethodA;
        public IntPtr GetFieldID;
        public IntPtr GetObjectField;
        public IntPtr GetBooleanField;
        public IntPtr GetByteField;
        public IntPtr GetCharField;
        public IntPtr GetShortField;
        public IntPtr GetIntField;
        public IntPtr GetLongField;
        public IntPtr GetFloatField;
        public IntPtr GetDoubleField;
        public IntPtr SetObjectField;
        public IntPtr SetBooleanField;
        public IntPtr SetByteField;
        public IntPtr SetCharField;
        public IntPtr SetShortField;
        public IntPtr SetIntField;
        public IntPtr SetLongField;
        public IntPtr SetFloatField;
        public IntPtr SetDoubleField;
        public IntPtr GetStaticmethodID;
        public IntPtr CallStaticObjectMethod;
        public IntPtr CallStaticObjectMethodV;
        public IntPtr CallStaticObjectMethodA;
        public IntPtr CallStaticBooleanMethod;
        public IntPtr CallStaticBooleanMethodV;
        public IntPtr CallStaticBooleanMethodA;
        public IntPtr CallStaticByteMethod;
        public IntPtr CallStaticByteMethodV;
        public IntPtr CallStaticByteMethodA;
        public IntPtr CallStaticCharMethod;
        public IntPtr CallStaticCharMethodV;
        public IntPtr CallStaticCharMethodA;
        public IntPtr CallStaticShortMethod;
        public IntPtr CallStaticShortMethodV;
        public IntPtr CallStaticShortMethodA;
        public IntPtr CallStaticIntMethod;
        public IntPtr CallStaticIntMethodV;
        public IntPtr CallStaticIntMethodA;
        public IntPtr CallStaticLongMethod;
        public IntPtr CallStaticLongMethodV;
        public IntPtr CallStaticLongMethodA;
        public IntPtr CallStaticFloatMethod;
        public IntPtr CallStaticFloatMethodV;
        public IntPtr CallStaticFloatMethodA;
        public IntPtr CallStaticDoubleMethod;
        public IntPtr CallStaticDoubleMethodV;
        public IntPtr CallStaticDoubleMethodA;
        public IntPtr CallStaticVoidMethod;
        public IntPtr CallStaticVoidMethodV;
        public IntPtr CallStaticVoidMethodA;
        public IntPtr GetStaticFieldID;
        public IntPtr GetStaticObjectField;
        public IntPtr GetStaticBooleanField;
        public IntPtr GetStaticByteField;
        public IntPtr GetStaticCharField;
        public IntPtr GetStaticShortField;
        public IntPtr GetStaticIntField;
        public IntPtr GetStaticLongField;
        public IntPtr GetStaticFloatField;
        public IntPtr GetStaticDoubleField;
        public IntPtr SetStaticObjectField;
        public IntPtr SetStaticBooleanField;
        public IntPtr SetStaticByteField;
        public IntPtr SetStaticCharField;
        public IntPtr SetStaticShortField;
        public IntPtr SetStaticIntField;
        public IntPtr SetStaticLongField;
        public IntPtr SetStaticFloatField;
        public IntPtr SetStaticDoubleField;
        public IntPtr NewString;
        public IntPtr GetStringLength;
        public IntPtr GetStringChars;
        public IntPtr ReleaseStringChars;
        public IntPtr NewStringUTF;
        public IntPtr GetStringUTFLength;
        public IntPtr GetStringUTFChars;
        public IntPtr ReleaseStringUTFChars;
        public IntPtr GetArrayLength;
        public IntPtr NewObjectArray;
        public IntPtr GetObjectArrayElement;
        public IntPtr SetObjectArrayElement;
        public IntPtr NewBooleanArray;
        public IntPtr NewByteArray;
        public IntPtr NewCharArray;
        public IntPtr NewShortArray;
        public IntPtr NewIntArray;
        public IntPtr NewLongArray;
        public IntPtr NewFloatArray;
        public IntPtr NewDoubleArray;
        public IntPtr GetBooleanArrayElements;
        public IntPtr GetByteArrayElements;
        public IntPtr GetCharArrayElements;
        public IntPtr GetShortArrayElements;
        public IntPtr GetIntArrayElements;
        public IntPtr GetLongArrayElements;
        public IntPtr GetFloatArrayElements;
        public IntPtr GetDoubleArrayElements;
        public IntPtr ReleaseBooleanArrayElements;
        public IntPtr ReleaseByteArrayElements;
        public IntPtr ReleaseCharArrayElements;
        public IntPtr ReleaseShortArrayElements;
        public IntPtr ReleaseIntArrayElements;
        public IntPtr ReleaseLongArrayElements;
        public IntPtr ReleaseFloatArrayElements;
        public IntPtr ReleaseDoubleArrayElements;
        public IntPtr GetBooleanArrayRegion;
        public IntPtr GetByteArrayRegion;
        public IntPtr GetCharArrayRegion;
        public IntPtr GetShortArrayRegion;
        public IntPtr GetIntArrayRegion;
        public IntPtr GetLongArrayRegion;
        public IntPtr GetFloatArrayRegion;
        public IntPtr GetDoubleArrayRegion;
        public IntPtr SetBooleanArrayRegion;
        public IntPtr SetByteArrayRegion;
        public IntPtr SetCharArrayRegion;
        public IntPtr SetShortArrayRegion;
        public IntPtr SetIntArrayRegion;
        public IntPtr SetLongArrayRegion;
        public IntPtr SetFloatArrayRegion;
        public IntPtr SetDoubleArrayRegion;
        public IntPtr RegisterNatives;
        public IntPtr UnregisterNatives;
        public IntPtr MonitorEnter;
        public IntPtr MonitorExit;
        public IntPtr GetJavaVM;

        // String Operations
        public IntPtr GetStringRegion;
        public IntPtr GetStringUTFRegion;

        // Array Operations
        public IntPtr GetPrimitiveArrayCritical;
        public IntPtr ReleasePrimitiveArrayCritical;

        // String Operations
        public IntPtr GetStringCritical;
        public IntPtr ReleaseStringCritical;

        // Weak Global References
        public IntPtr NewWeakGlobalRef;
        public IntPtr DeleteWeakGlobalRef;

        // Exceptions
        public IntPtr ExceptionCheck;

        // J2SDK1_4
        public IntPtr NewDirectByteBuffer;
        public IntPtr GetDirectBufferAddress;
        public IntPtr GetDirectBufferCapacity;

        // JNI 1.6
        public IntPtr GetObjectRefType;

        // Modules
        public IntPtr GetModule;

    }
    #region delegation structure
    // Structure for function delegations
    internal unsafe struct JNINativeInterface_ {
        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jobject AllocObject(JNIEnvPtr env, IntPtr clazz);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jboolean CallBooleanMethod(JNIEnvPtr env, jobject obj, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jbyte CallByteMethod(JNIEnvPtr env, jobject obj, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate ushort CallCharMethod(JNIEnvPtr env, jobject obj, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate double CallDoubleMethod(JNIEnvPtr env, jobject obj, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate float CallFloatMethod(JNIEnvPtr env, jobject obj, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int CallIntMethod(JNIEnvPtr env, jobject obj, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate long CallLongMethod(JNIEnvPtr env, jobject obj, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr CallObjectMethod(JNIEnvPtr env, jobject obj, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate short CallShortMethod(JNIEnvPtr env, jobject obj, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void CallVoidMethod(JNIEnvPtr env, jobject obj, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jboolean CallNonvirtualBooleanMethod(jobject obj, jclass clazz, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jboolean CallNonvirtualByteMethod(JNIEnvPtr env, jobject obj, jclass clazz,
                                                        jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate ushort CallNonvirtualCharMethod(JNIEnvPtr env, jobject obj, jclass clazz,
                                                          jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate double CallNonvirtualDoubleMethod(JNIEnvPtr env, jobject obj, jclass clazz,
                                                            jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate float CallNonvirtualFloatMethod(JNIEnvPtr env, jobject obj, jclass clazz,
                                                          jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int CallNonvirtualIntMethod(JNIEnvPtr env, jobject obj, jclass clazz,
                                                      jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate long CallNonvirtualLongMethod(JNIEnvPtr env, jobject obj, jclass clazz,
                                                        jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr CallNonvirtualObjectMethod(JNIEnvPtr env, jobject obj, jclass clazz,
                                                            jmethodID methodID, params JValue[] args
            );

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate short CallNonvirtualShortMethod(JNIEnvPtr env, jobject obj, jclass clazz,
                                                          jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void CallNonvirtualVoidMethod(JNIEnvPtr env, jobject obj, jclass clazz,
                                                        jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jboolean CallStaticBooleanMethod(JNIEnvPtr env, jclass clazz,
                                                       jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jbyte CallStaticByteMethod(JNIEnvPtr env, jclass clazz, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate ushort CallStaticCharMethod(JNIEnvPtr env, jclass clazz, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate double CallStaticDoubleMethod(JNIEnvPtr env, jclass clazz, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate float CallStaticFloatMethod(JNIEnvPtr env, jclass clazz, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int CallStaticIntMethod(JNIEnvPtr env, jobject obj, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate long CallStaticLongMethod(JNIEnvPtr env, jclass clazz, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr CallStaticObjectMethod(JNIEnvPtr env, jclass clazz, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate short CallStaticShortMethod(JNIEnvPtr env, jclass clazz, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int CallStaticVoidMethod(JNIEnvPtr env, jclass clazz, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr DefineClass(JNIEnvPtr env,
                                             [MarshalAs(UnmanagedType.LPStr)] string name, jobject loader,
                                             IntPtr buf /*const jbyte* */, int len);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        [SuppressUnmanagedCodeSecurity]
        internal delegate void DeleteGlobalRef(JNIEnvPtr env, jobject globalRef);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        [SuppressUnmanagedCodeSecurity]
        internal delegate void DeleteLocalRef(JNIEnvPtr env, jobject localRef);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void DeleteWeakGlobalRef(JNIEnvPtr env, jweak obj);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int EnsureLocalCapacity(JNIEnvPtr env, int capacity);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jboolean ExceptionCheck(JNIEnvPtr env);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ExceptionClear(JNIEnvPtr env);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ExceptionDescribe(JNIEnvPtr env);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr ExceptionOccurred(JNIEnvPtr env);

        // Only excpetion to const char* marshalling (unicode modified UTF-8 is used instead of ansi)
        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void FatalError(JNIEnvPtr env, IntPtr msg);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr FindClass(JNIEnvPtr env, [MarshalAs(UnmanagedType.LPStr)] string name);
        

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetSuperclass(JNIEnvPtr env, jclass clazz);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jboolean IsAssignableFrom(JNIEnvPtr env, jclass clazz1, jclass clazz2);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr FromReflectedField(JNIEnvPtr env, jobject field);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr FromReflectedMethod(JNIEnvPtr env, jobject method);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int GetArrayLength(JNIEnvPtr env, jarray array);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jboolean* GetBooleanArrayElements(JNIEnvPtr env, jbooleanArray array, byte* isCopy);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void GetBooleanArrayRegion(JNIEnvPtr env, IntPtr array, int start, int len, byte* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jboolean GetBooleanField(JNIEnvPtr env, jobject obj, jfieldID fieldId);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jbyte* GetByteArrayElements(JNIEnvPtr env, jbyteArray array, byte* isCopy);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void GetByteArrayRegion(JNIEnvPtr env, jbyteArray array, int start, int len, byte* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jbyte GetByteField(JNIEnvPtr env, jobject obj, jfieldID fieldId);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate ushort* GetCharArrayElements(JNIEnvPtr env, jcharArray array, byte* isCopy);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void GetCharArrayRegion(JNIEnvPtr env, IntPtr array, int start, int len, char* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate ushort GetCharField(JNIEnvPtr env, jobject obj, jfieldID fieldId);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetDirectBufferAddress(JNIEnvPtr env, IntPtr buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate long GetDirectBufferCapacity(JNIEnvPtr env, IntPtr buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate double* GetDoubleArrayElements(JNIEnvPtr env, jdoubleArray array, byte* isCopy);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void GetDoubleArrayRegion(JNIEnvPtr env, IntPtr array, int start, int len, double* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate double GetDoubleField(JNIEnvPtr env, jobject obj, jfieldID fieldId);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetFieldID(JNIEnvPtr env, jclass clazz, [MarshalAs(UnmanagedType.LPStr)] string name,
            [MarshalAs(UnmanagedType.LPStr)] string sig);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jfloat* GetFloatArrayElements(JNIEnvPtr env, jfloatArray array, byte* isCopy);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void GetFloatArrayRegion(JNIEnvPtr env, jfloatArray array, int start, int len, float* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate float GetFloatField(JNIEnvPtr env, jobject obj, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int* GetIntArrayElements(JNIEnvPtr env, jintArray array, byte* isCopy);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void GetIntArrayRegion(JNIEnvPtr env, jintArray array, int start, int len, int* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int GetIntField(JNIEnvPtr env, jobject obj, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int GetJavaVM(JNIEnvPtr env, out IntPtr vm);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate long* GetLongArrayElements(JNIEnvPtr env, jlongArray array, byte* isCopy);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void GetLongArrayRegion(JNIEnvPtr env, jlongArray array, int start, int len, long* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate long GetLongField(JNIEnvPtr env, jobject obj, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetMethodID(JNIEnvPtr env, jclass clazz, [MarshalAs(UnmanagedType.LPStr)] string name,
            [MarshalAs(UnmanagedType.LPStr)] string sig);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetObjectArrayElement(JNIEnvPtr env, jobjectArray array, int index);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetObjectClass(JNIEnvPtr env, jobject obj);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetObjectField(JNIEnvPtr env, jobject obj, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void* GetPrimitiveArrayCritical(JNIEnvPtr env, jarray array, byte* isCopy);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate short* GetShortArrayElements(JNIEnvPtr env, jshortArray array, byte* isCopy);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void GetShortArrayRegion(JNIEnvPtr env, jshortArray array, int start, int len, short* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate short GetShortField(JNIEnvPtr env, jobject obj, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jboolean GetStaticBooleanField(JNIEnvPtr env, jclass clazz, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jbyte GetStaticByteField(JNIEnvPtr env, jclass clazz, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate ushort GetStaticCharField(JNIEnvPtr env, jclass clazz, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate double GetStaticDoubleField(JNIEnvPtr env, jclass clazz, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetStaticFieldID(JNIEnvPtr env, jclass clazz, [MarshalAs(UnmanagedType.LPStr)] string name,
            [MarshalAs(UnmanagedType.LPStr)] string sig);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate float GetStaticFloatField(JNIEnvPtr env, jclass clazz, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int GetStaticIntField(JNIEnvPtr env, jclass clazz, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate long GetStaticLongField(JNIEnvPtr env, jclass clazz, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetStaticmethodID(JNIEnvPtr env, jclass clazz,
                                                   [MarshalAs(UnmanagedType.LPStr)] string name,
                                                   [MarshalAs(UnmanagedType.LPStr)] string sig);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetStaticObjectField(JNIEnvPtr env, jclass clazz, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate short GetStaticShortField(JNIEnvPtr env, jclass clazz, jfieldID fieldID);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetStringChars(JNIEnvPtr env, jstring str, byte* isCopy);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetStringCritical(JNIEnvPtr env, IntPtr str, byte* isCopy);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int GetStringLength(JNIEnvPtr env, IntPtr str);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void GetStringRegion(JNIEnvPtr env, IntPtr str, int start, int len, char* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr GetStringUTFChars(JNIEnvPtr env, IntPtr str, IntPtr isCopy);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int GetStringUTFLength(JNIEnvPtr env, IntPtr str);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void GetStringUTFRegion(JNIEnvPtr env, IntPtr str, int start, int len, char* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int GetVersion(JNIEnvPtr env);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jboolean IsSameObject(JNIEnvPtr env, IntPtr o1, IntPtr o2);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int MonitorEnter(JNIEnvPtr env, IntPtr obj);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int MonitorExit(JNIEnvPtr env, IntPtr obj);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewBooleanArray(JNIEnvPtr env, int len);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewByteArray(JNIEnvPtr env, int len);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewCharArray(JNIEnvPtr env, int len);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewDirectByteBuffer(JNIEnvPtr env, IntPtr address, long capacity);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewDoubleArray(JNIEnvPtr env, int len);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewFloatArray(JNIEnvPtr env, int len);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        [SuppressUnmanagedCodeSecurity]
        internal delegate IntPtr NewGlobalRef(JNIEnvPtr env, IntPtr lobj);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewIntArray(JNIEnvPtr env, int len);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewLocalRef(JNIEnvPtr env, IntPtr reference);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewLongArray(JNIEnvPtr env, int len);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewObject(JNIEnvPtr env, jclass clazz, jmethodID methodID, params JValue[] args);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewObjectArray(JNIEnvPtr env, int len, jclass clazz, IntPtr init);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewShortArray(JNIEnvPtr env, int len);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewString(JNIEnvPtr env, [MarshalAs(UnmanagedType.LPWStr)] string unicode, int len);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewStringUTF(JNIEnvPtr env, IntPtr utf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr NewWeakGlobalRef(JNIEnvPtr env, IntPtr obj);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate IntPtr PopLocalFrame(JNIEnvPtr env, IntPtr result);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int PushLocalFrame(JNIEnvPtr env, int capacity);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int RegisterNatives(JNIEnvPtr env, jclass clazz, JNINativeMethod* methods, int nMethods);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int UnregisterNatives(JNIEnvPtr env, IntPtr clazz);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ReleaseBooleanArrayElements(JNIEnvPtr env, jbooleanArray array, byte* elems, int mode);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ReleaseByteArrayElements(JNIEnvPtr env, jbyteArray array, sbyte* elems, int mode);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ReleaseCharArrayElements(JNIEnvPtr env, jcharArray array, ushort* elems, int mode);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ReleaseDoubleArrayElements(JNIEnvPtr env, jdoubleArray array, double* elems, int mode);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ReleaseFloatArrayElements(JNIEnvPtr env, jfloatArray array, jfloat* elems, int mode);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ReleaseIntArrayElements(JNIEnvPtr env, jintArray array, int* elems, int mode);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ReleaseLongArrayElements(JNIEnvPtr env, jlongArray array, long* elems, int mode);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ReleasePrimitiveArrayCritical(JNIEnvPtr env, IntPtr array, void* carray, int mode);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ReleaseShortArrayElements(JNIEnvPtr env, jshortArray array, short* elems, int mode);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ReleaseStringChars(JNIEnvPtr env, IntPtr str, IntPtr chars);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ReleaseStringCritical(JNIEnvPtr env, IntPtr str, IntPtr cstring);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void ReleaseStringUTFChars(JNIEnvPtr env, IntPtr str, IntPtr chars);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetBooleanArrayRegion(JNIEnvPtr env, jbooleanArray array, int start, int len, byte* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetBooleanField(JNIEnvPtr env, jobject obj, jfieldID fieldID, byte val);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetByteArrayRegion(JNIEnvPtr env, IntPtr array, int start, int len, sbyte* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetByteField(JNIEnvPtr env, jobject obj, jfieldID fieldID, sbyte val);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetCharArrayRegion(JNIEnvPtr env, jcharArray array, int start, int len, char* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetCharField(JNIEnvPtr env, jobject obj, jfieldID fieldID, ushort val);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetDoubleArrayRegion(JNIEnvPtr env, jdoubleArray array, int start, int len, double* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetDoubleField(JNIEnvPtr env, jobject obj, jfieldID fieldID, double val);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetFloatArrayRegion(JNIEnvPtr env, jfloatArray array, int start, int len, float* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetFloatField(JNIEnvPtr env, jobject obj, jfieldID fieldID, float val);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetIntArrayRegion(JNIEnvPtr env, jintArray array, int start, int len, int* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetIntField(JNIEnvPtr env, jobject obj, jfieldID fieldID, int val);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetLongArrayRegion(JNIEnvPtr env, jlongArray array, int start, int len, long* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetLongField(JNIEnvPtr env, jobject obj, jfieldID fieldID, long val);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetObjectArrayElement(JNIEnvPtr env, jobjectArray array, int index, IntPtr val);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetObjectField(JNIEnvPtr env, jobject obj, jfieldID fieldID, IntPtr val);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetShortArrayRegion(JNIEnvPtr env, jshortArray array, int start, int len, short* buf);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetShortField(JNIEnvPtr env, jobject obj, jfieldID fieldID, short val);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetStaticBooleanField(JNIEnvPtr env, jclass clazz, jfieldID fieldID, jboolean value);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetStaticByteField(JNIEnvPtr env, jclass clazz, jfieldID fieldID, sbyte value);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetStaticCharField(JNIEnvPtr env, jclass clazz, jfieldID fieldID, ushort value);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetStaticDoubleField(JNIEnvPtr env, jclass clazz, jfieldID fieldID, double value);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetStaticFloatField(JNIEnvPtr env, jclass clazz, jfieldID fieldID, float value);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetStaticIntField(JNIEnvPtr env, jclass clazz, jfieldID fieldID, int value);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetStaticLongField(JNIEnvPtr env, jclass clazz, jfieldID fieldID, long value);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetStaticObjectField(JNIEnvPtr env, jclass clazz, jfieldID fieldID, jobject value);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate void SetStaticShortField(JNIEnvPtr env, jclass clazz, jfieldID fieldID, short value);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int Throw(JNIEnvPtr env, jthrowable obj);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int ThrowNew(JNIEnvPtr env, jclass clazz, IntPtr msg);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jobject ToReflectedField(JNIEnvPtr env, jclass clazz, jfieldID fieldID, byte isStatic);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jobject ToReflectedMethod(JNIEnvPtr env, jclass clazz, jmethodID methodID, byte isStatic);

        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate int UnregisterJavaPtrs(JNIEnvPtr env, jclass clazz);

        // JDK 1.6
        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jobjectRefType GetObjectRefType(JNIEnvPtr env, jobject obj);

        // Modules
        [UnmanagedFunctionPointer(JavaVM.CC)]
        internal delegate jobject GetModule(JNIEnvPtr env, jclass clazz);
    }

    #endregion
}