// I have not implemented the JDK1_1InitArgs because I do not see the need to
// support legacy code. i.e jre versions of 1.1 or lower are not likely to be ever used by myself any more.


using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;
using System.Runtime.ConstrainedExecution;
using System.Security;



namespace org.daisy.jnet {
    public unsafe class JavaVM : IDisposable
    {
        private IntPtr _jvm;
        private JNIInvokeInterface _functions;
        public const CallingConvention CC = CallingConvention.Winapi;

        private static IntPtr _dllPtr = IntPtr.Zero;

        // If loading the library is not enough for DLL Import to get the correct jvml
        // https://stackoverflow.com/questions/16518943/dllimport-or-loadlibrary-for-best-performance

        /// <summary>
        /// Load a JVM dll to use as java server for the java vm calls <br/>
        /// Notes : <br/>
        /// - the previous library is released if one was already launched<br/>
        /// - Alledgedly, a library previously load is prioritized<br/>
        /// https://docs.microsoft.com/fr-fr/windows/win32/dlls/dynamic-link-library-search-order?redirectedfrom=MSDN
        /// - For .NET 6 (standard and core), switching to NativeLibrary for library loading
        /// </summary>
        /// <param name="jvm_dll_path"></param>
        public static void loadAssembly(string jvm_dll_path) {
            
            if(_dllPtr != IntPtr.Zero) {
                NativeLibrary.Free(_dllPtr);
            }
            try
            {
                _dllPtr = NativeLibrary.Load(jvm_dll_path);
                // Load JNI base methods
                if (NativeLibrary.TryGetExport(_dllPtr, "JNI_CreateJavaVM", out IntPtr JNI_CreateJavaVMHandle))
                {
                    JNI_CreateJavaVM = (JNI_CreateJavaVMHandler)Marshal.GetDelegateForFunctionPointer(JNI_CreateJavaVMHandle, typeof(JNI_CreateJavaVMHandler));
                }
                else throw new Exception($"Could not load the JNI_CreateJavaVM method from the library : {jvm_dll_path}");
                if (NativeLibrary.TryGetExport(_dllPtr, "JNI_GetDefaultJavaVMInitArgs", out IntPtr JNI_GetDefaultJavaVMInitArgsHandle))
                {
                    JNI_GetDefaultJavaVMInitArgs = (JNI_GetDefaultJavaVMInitArgsHandler)Marshal.GetDelegateForFunctionPointer(JNI_GetDefaultJavaVMInitArgsHandle, typeof(JNI_GetDefaultJavaVMInitArgsHandler));
                }
                else throw new Exception($"Could not load the JNI_GetDefaultJavaVMInitArgs method from the library : {jvm_dll_path}");
                if (NativeLibrary.TryGetExport(_dllPtr, "JNI_GetCreatedJavaVMs", out IntPtr JNI_GetCreatedJavaVMsHandle))
                {
                    JNI_GetCreatedJavaVMs = (JNI_GetCreatedJavaVMsHandler)Marshal.GetDelegateForFunctionPointer(JNI_GetCreatedJavaVMsHandle, typeof(JNI_GetCreatedJavaVMsHandler));
                }
                else throw new Exception($"Could not load the JNI_GetCreatedJavaVMs method from the library : {jvm_dll_path}");
            }
            catch (Exception)
            {
                throw;
            }
        }





        /// <summary>
        /// Mapping to JNI C function _JNI_IMPORT_OR_EXPORT_ jint JNICALL JNI_CreateJavaVM(JavaVM** pvm, void** penv, void* args);
        /// </summary>
        /// <param name="pVM"></param>
        /// <param name="pEnv"></param>
        /// <param name="Args"></param>
        /// <returns></returns>
        public static JNI_CreateJavaVMHandler JNI_CreateJavaVM = (out IntPtr pVM, out IntPtr pEnv, JavaVMInitArgs* Args) => { throw new Exception("JNI_CreateJavaVM method not retrieved from jvm library"); };
        public delegate int JNI_CreateJavaVMHandler(out IntPtr pVM, out IntPtr pEnv, JavaVMInitArgs* Args);

        /// <summary>
        /// Mapping to JNI C function _JNI_IMPORT_OR_EXPORT_ jint JNICALL JNI_GetDefaultJavaVMInitArgs(void* args);
        /// </summary>
        /// <param name="args"></param>
        /// <returns></returns>
        public static JNI_GetDefaultJavaVMInitArgsHandler JNI_GetDefaultJavaVMInitArgs = (JavaVMInitArgs* Args) => { throw new Exception("JNI_GetDefaultJavaVMInitArgs method not retrieved from jvm library"); };
        public delegate int JNI_GetDefaultJavaVMInitArgsHandler(JavaVMInitArgs* Args);

        /// <summary>
        /// Mapping to JNI C function _JNI_IMPORT_OR_EXPORT_ jint JNICALL JNI_GetCreatedJavaVMs(JavaVM **, jsize, jsize *);
        /// </summary>
        /// <param name="pVM"></param>
        /// <param name="jSize1"></param>
        /// <param name="jSize2"></param>
        /// <returns></returns>
        public static JNI_GetCreatedJavaVMsHandler JNI_GetCreatedJavaVMs = (out IntPtr pVM, int jSize1, [Out] out int jSize2) => { throw new Exception("JNI_GetCreatedJavaVMs method not retrieved from jvm library"); };
        public delegate int JNI_GetCreatedJavaVMsHandler(out IntPtr pVM, int jSize1, [Out] out int jSize2);



        // We need to have delegates for each function pointer for the methods 
        // in the JavaVM structure in the DLL
        /// <summary>
        /// Mapping to JNI JNIInvokeInterface_ struct
        /// </summary>
        public struct JNIInvokeInterface_
        {            
            [UnmanagedFunctionPointer(JavaVM.CC)]
            [SuppressUnmanagedCodeSecurity]
            internal delegate int DestroyJavaVM(IntPtr pVM);

            [UnmanagedFunctionPointer(JavaVM.CC)]
            [SuppressUnmanagedCodeSecurity]
            internal delegate int AttachCurrentThread(IntPtr pVM, out IntPtr pEnv, JavaVMInitArgs* Args);

            [UnmanagedFunctionPointer(JavaVM.CC)]
            [SuppressUnmanagedCodeSecurity]
            internal delegate int DetachCurrentThread(IntPtr pVM);

            [UnmanagedFunctionPointer(JavaVM.CC)]
            [SuppressUnmanagedCodeSecurity]
            internal delegate int GetEnv(IntPtr pVM, out IntPtr pEnv, int Version);
            // J2SDK1_4
            [UnmanagedFunctionPointer(JavaVM.CC)]
            [SuppressUnmanagedCodeSecurity]
            internal delegate int AttachCurrentThreadAsDaemon(IntPtr pVM, out IntPtr pEnv, JavaVMInitArgs* Args);
        }

        // Have a structure that mimic the same structure of all the methods and offsets of each of the methods
        // in the JavaVM structure in the DLL
        [StructLayout(LayoutKind.Sequential), NativeCppClass]
        public struct JNIInvokeInterface
        {
            public IntPtr reserved0;
            public IntPtr reserved1;
            public IntPtr reserved2;

            public IntPtr DestroyJavaVM;
            public IntPtr AttachCurrentThread;
            public IntPtr DetachCurrentThread;
            public IntPtr GetEnv;
            public IntPtr AttachCurrentThreadAsDaemon;
        }

        [StructLayout(LayoutKind.Sequential, Size = 4), NativeCppClass]
        private struct JNIInvokeInterfacePtr
        {
            public readonly JNIInvokeInterface* functions;
        }

        private JNIInvokeInterface_.AttachCurrentThread? _attachCurrentThread;
        private JNIInvokeInterface_.AttachCurrentThreadAsDaemon? _attachCurrentThreadAsDaemon;
        private JNIInvokeInterface_.DestroyJavaVM? _destroyJavaVm;
        private JNIInvokeInterface_.DetachCurrentThread? _detachCurrentThread;
        private JNIInvokeInterface_.GetEnv? _getEnv;

        
        /// <summary>
        /// 
        /// </summary>
        /// <param name="pointer"></param>
        public JavaVM(IntPtr pointer)
        {
            this._jvm = pointer;
            _functions = *(*(JNIInvokeInterfacePtr*)_jvm.ToPointer()).functions;
        }

        public static bool ByteToBoolean(byte b)
        {
            return b != JNIBooleanValue.JNI_FALSE ? true : false;
        }

        public static byte BooleanToByte(bool value)
        {
            return value ? (byte)JNIBooleanValue.JNI_TRUE : (byte)JNIBooleanValue.JNI_FALSE;
        }

        /// <summary>
        /// Retrieve a delegate function for a function pointer
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="ptr"></param>
        /// <param name="res"></param>
        public static void GetDelegateForFunctionPointer<T>(IntPtr ptr, ref T? res)
        {  // Converts an unmanaged function pointer to a delegate.
            res = (T)(object)Marshal.GetDelegateForFunctionPointer(ptr, typeof(T));
            // Note : after .net framework 4.5.1, function is now using template notation instead of parameter for the type
        }

        /// <summary>
        /// Retrieve a delegate function for a function pointer
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="ptr"></param>
        /// <param name="targetForTypeInference">can be optionnal but the target can be need as parameter for automatic Type inference</param>
        /// <returns></returns>
        public static T GetDelegateForFunctionPointer<T>(IntPtr ptr, T? targetForTypeInference)
        {  // Converts an unmanaged function pointer to a delegate.
            return (T)(object)Marshal.GetDelegateForFunctionPointer(ptr, typeof(T));
            // Note : after .net framework 4.5.1, function is now using template notation instead of parameter for the type
        }

        internal int AttachCurrentThread(out JNIEnv penv, JavaVMInitArgs? args)
        {
            if (_attachCurrentThread == null)
            {
                //attachCurrentThread = (JNIInvokeInterface_.AttachCurrentThread)Marshal.GetDelegateForFunctionPointer(functions.AttachCurrentThread, typeof(JNIInvokeInterface_.AttachCurrentThread));
                _attachCurrentThread = GetDelegateForFunctionPointer(_functions.AttachCurrentThread, _attachCurrentThread);

            } 
            IntPtr env;
            int result;
            if (args.HasValue)
            {
                JavaVMInitArgs initArgs = args.Value;
                result = _attachCurrentThread.Invoke(_jvm, out env, &initArgs);
            }
            else
            {
                result = _attachCurrentThread.Invoke(_jvm, out env, null);
            }
            penv = new JNIEnv(env);
            return result;
        }

        // This is only available in JNI_VERSION_1_4 or higher.
        [SuppressUnmanagedCodeSecurity]
        [ReliabilityContract(Consistency.WillNotCorruptState, Cer.Success)]
        public int AttachCurrentThreadAsDaemon(out JNIEnv penv, JavaVMInitArgs? args)
        {
            if (_attachCurrentThreadAsDaemon == null)
            {
                _attachCurrentThreadAsDaemon = GetDelegateForFunctionPointer(
                        _functions.AttachCurrentThreadAsDaemon,
                        _attachCurrentThreadAsDaemon
                );
            }
            IntPtr env;
            int result;
            if (!args.Equals(null))
            {
                JavaVMInitArgs value = args.Value;
                result = _attachCurrentThreadAsDaemon.Invoke(_jvm, out env, &value);
            }
            else
            {
                result = _attachCurrentThreadAsDaemon.Invoke(_jvm, out env, null);
            }
            if (result == JNIReturnValue.JNI_OK)
            {
                penv = new JNIEnv(env);
            }
            else
            {
                penv = null;
            }
            return result;
        }

        public int DestroyJavaVM()
        {
            if (_destroyJavaVm == null)
            {
                _destroyJavaVm = GetDelegateForFunctionPointer(_functions.DestroyJavaVM, _destroyJavaVm);
            }
            return _destroyJavaVm.Invoke(_jvm);
        }

        public int DetachCurrentThread()
        {
            if (_detachCurrentThread == null)
            {
                _detachCurrentThread = GetDelegateForFunctionPointer(_functions.DetachCurrentThread, _detachCurrentThread);
            }
            return _detachCurrentThread.Invoke(_jvm);
        }

        public int GetEnv(out JNIEnv penv, int version)
        {
            if (_getEnv == null)
            {
                _getEnv = GetDelegateForFunctionPointer(_functions.GetEnv, _getEnv);
            }
            IntPtr env;
            int result = _getEnv.Invoke(_jvm, out env, version);
            penv = new JNIEnv(env);
            return result;
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        ~JavaVM() { Dispose(false); }

        protected virtual void Dispose(bool disposing)
        {
            if (_jvm != IntPtr.Zero)
            {
                Marshal.FreeCoTaskMem(_jvm);
                _jvm = IntPtr.Zero;
            }           
        }
    }
}
