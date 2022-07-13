using org.daisy.jnet;
using System.Reflection;

namespace org.daisy
{

    /// <summary>
    /// Pipeline 2 launcher
    /// </summary>
    public class Pipeline {

        /// <summary>
        /// Get the pipeline 2 root directory
        /// </summary>
        
        private static string _path = (System.OperatingSystem.IsMacCatalyst() || System.OperatingSystem.IsMacOS()) ?
            Path.Combine(
                Path.GetDirectoryName(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)),
                "Resources",
                "daisy-pipeline"
            ) :
             Path.Combine(
                 Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location),
                 "daisy-pipeline"
            );
        public static string InstallationPath {
            get { return _path; }
            set { _path = value; }
        }

        private JavaNativeInterface jni;

        // Classes
        private IntPtr SimpleAPIClass,
            JobClass,
            JobContextClass,
            JobMonitorClass,
            HashMapClass,
            JobStatusClass,
            MessageAccessorClass,
            BigDecimalClass;

        #region Singleton initialisation

        private static Pipeline instance = null;
        // for thread safety
        private static readonly object padlock = new object();

        private Pipeline(
            string installationPath = "", 
            PipelineOutputListener onOutput = null,
            PipelineErrorListener onError = null
        ) {
            if (!string.IsNullOrEmpty(installationPath))
            {
                InstallationPath = installationPath;
            }
            // use jnet to execute the conversion on the inputPath
            // check for arch specific jre based on how the jre folders are created by the daisy/pipeline-assembly project (lite-bridge version)
            //string arch = (IntPtr.Size * 8).ToString();
            //string jrePath = Directory.Exists(InstallationPath + @"\jre" + arch) ?
            //    InstallationPath + @"\jre" + (IntPtr.Size * 8).ToString() :
            //    InstallationPath + @"\jre";
            List<string> ClassFolders = new List<string> {
                Path.Combine(InstallationPath, "system", "common"),
                Path.Combine(InstallationPath, "system", "no-osgi"),
                Path.Combine(InstallationPath, "system", "simple-api"),
                Path.Combine(InstallationPath, "system", "volatile"),
                Path.Combine(InstallationPath, "modules")
            };

            List<string> JarPathes = ClassFolders.Aggregate(
                new List<string>(),
                (List<string> classPath, string path) => {
                    return Directory.Exists(path) ?
                        classPath.Concat(
                            Directory.EnumerateFiles(path, "*.jar", SearchOption.AllDirectories)
                        // .Select( fullPath => fullPath.Remove(0, InstallationPath.Length) ) // if needed to convert fullpath to installation relative path 
                        ).ToList() : classPath;
                }
            );
            string ClassPath = JarPathes.Count > 0
            ? JarPathes.Aggregate(
                (acc, path) => acc + Path.PathSeparator + path
                ) + Path.PathSeparator + Path.Combine(InstallationPath, "system", "simple-api")
            : "";

            if (ClassPath == "")
            {
                throw new Exception("Pipeline jars were not found near the executing assembly, aborting pipeline init.");
            }
            List<string> JavaOptions = new List<string> {
                "-Dcom.sun.management.jmxremote",
                "--add-opens=java.base/java.security=ALL-UNNAMED",
                "--add-opens=java.base/java.net=ALL-UNNAMED",
                "--add-opens=java.base/java.lang=ALL-UNNAMED",
                "--add-opens=java.base/java.util=ALL-UNNAMED",
                "--add-opens=java.naming/javax.naming.spi=ALL-UNNAMED",
                "--add-opens=java.rmi/sun.rmi.transport.tcp=ALL-UNNAMED",
                "--add-exports=java.base/sun.net.www.protocol.http=ALL-UNNAMED",
                "--add-exports=java.base/sun.net.www.protocol.https=ALL-UNNAMED",
                "--add-exports=java.base/sun.net.www.protocol.jar=ALL-UNNAMED",
                "--add-exports=jdk.xml.dom/org.w3c.dom.html=ALL-UNNAMED",
                "--add-exports=jdk.naming.rmi/com.sun.jndi.url.rmi=ALL-UNNAMED"
            };

            Dictionary<string, string> SystemProps = new Dictionary<string, string> {
                { "-Dorg.daisy.pipeline.properties", "\"" + Path.Combine(InstallationPath,"etc", "pipeline.properties") + "\"" },
                // Logback configuration file
                { "-Dlogback.configurationFile", "\"file:" + Path.Combine(InstallationPath,"etc", "config-logback.xml").Replace("\\","/") + "\"" },
                // XMLCalabash base configuration file
                { "-Dorg.daisy.pipeline.xproc.configuration", Path.Combine(InstallationPath,"etc", "config-calabash.xml").Replace("\\","/") },
                // Version number as returned by "alive" call
                { "-Dorg.daisy.pipeline.version", "" + PipelineVersion },
                // Updater configuration
                { "-Dorg.daisy.pipeline.updater.bin", "\"" + Path.Combine(InstallationPath,"updater", "pipeline-updater").Replace("\\","/") + "\"" },
                { "-Dorg.daisy.pipeline.updater.deployPath", "\"" + InstallationPath.Replace("\\","/") + "/\"" },
                { "-Dorg.daisy.pipeline.updater.releaseDescriptor", "\"" + Path.Combine(InstallationPath,"etc", "releaseDescriptor.xml").Replace("\\","/") + "\"" },
                // Workaround for encoding bugs on Windows
                { "-Dfile.encoding", "UTF8" },
                // to make ${org.daisy.pipeline.data}, ${org.daisy.pipeline.logdir} and ${org.daisy.pipeline.mode}
                // available in config-logback.xml and felix.properties
                // note that config-logback.xml is the only place where ${org.daisy.pipeline.mode} is used
                { "-Dorg.daisy.pipeline.data", AppDataFolder },
                { "-Dorg.daisy.pipeline.logdir", "\"" + LogsFolder + "\"" },
                { "-Dorg.daisy.pipeline.mode", "cli" }
            };

            List<string> options = new List<string>();
            options = JavaOptions
                .Concat(
                    SystemProps.Aggregate(
                        new List<string>(),
                        (List<string> opts, KeyValuePair<string, string> opt) => {
                            opts.Add(opt.Key.ToString() + "=" + opt.Value.ToString());
                            return opts;
                        })).ToList();
            
            options.Add("-Djava.class.path=" + ClassPath);
            try
            {
                jni = new JavaNativeInterface(options);
                // Initialize runner in the JVM
                SimpleAPIClass = jni.GetJavaClass("SimpleAPI");
                JobClass = jni.GetJavaClass("org/daisy/pipeline/job/Job");
                JobContextClass = jni.GetJavaClass("org/daisy/pipeline/job/JobContext");
                JobMonitorClass = jni.GetJavaClass("org/daisy/pipeline/job/JobMonitor");
                HashMapClass = jni.GetJavaClass("java/util/HashMap");
                JobStatusClass = jni.GetJavaClass("org/daisy/pipeline/job/Job$Status");
                MessageAccessorClass = jni.GetJavaClass("org/daisy/common/messaging/MessageAccessor");
                BigDecimalClass = jni.GetJavaClass("java/math/BigDecimal");
            } catch (Exception)
            {
                throw;
            }
        }

        private void Dispose() {
            jni.Dispose();
            jni = null;
        }

        public static Pipeline getInstance(
            string installationPath = "",
            PipelineOutputListener onOutput = null,
            PipelineErrorListener onError = null)
        {
            lock (padlock)
            {
                if (instance == null)
                {
                    instance = new Pipeline(installationPath, onOutput, onError);
                } else
                {
                    if(onOutput != null)
                    {
                        instance.SetPipelineOutputListener(onOutput);
                    }
                    if (onError != null)
                    {
                        instance.SetPipelineErrorListener(onError);
                    }
                }
                return instance;
            }
        }

        /// <summary>
        /// 
        /// </summary>
        public static Pipeline Instance {
            get {
                lock (padlock) {
                    if (instance == null) {
                        instance = new Pipeline();
                    }
                    return instance;
                }
            }
        }

        /// <summary>
        /// 
        /// </summary>
        public static void KillInstance() {
            lock (padlock) {
                if (instance != null) {
                    instance.Dispose();
                    instance = null;
                    
                }
            }
        }
        #endregion


        #region JVM options (extracted from batch and bash launchers)

        private static string PipelineVersion = "1.14.5";

        

        public static string AppDataFolder {
            get { return Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + @"\DAISY Pipeline 2"; }
        }

        public static string LogsFolder {
            get { return Path.Combine(AppDataFolder, @"log"); }
        }


        #endregion

        public delegate void PipelineOutputListener(string message);
        private event PipelineOutputListener OnPipelineOutputEvent;
        public void SetPipelineOutputListener(PipelineOutputListener onPipelineOutput) {
            this.OnPipelineOutputEvent = onPipelineOutput;
        }
        public PipelineOutputListener OnPipelineOutput => OnPipelineOutputEvent;


        public delegate void PipelineErrorListener(string message);
        private event PipelineErrorListener OnPipelineErrorEvent;
        public void SetPipelineErrorListener(PipelineErrorListener onPipelineError) {
            this.OnPipelineErrorEvent = onPipelineError;
        }

        public PipelineErrorListener OnPipelineError => this.OnPipelineErrorEvent;

        public List<pipeline.Script> getScriptsList()
        {
            throw new NotImplementedException();
        }

        public IntPtr Start(string scriptName, Dictionary<string, string> options = null)
        {
            try
            {
                IntPtr hashMap = jni.NewObject(HashMapClass);
                if (options != null) foreach (KeyValuePair<string, string> option in options)
                    {
                        IntPtr temp = jni.CallMethod<IntPtr>(
                            HashMapClass,
                            hashMap,
                            "put",
                            "(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;",
                            option.Key,
                            option.Value
                        );
                    }

                IntPtr job = jni.CallMethod<IntPtr>(
                    SimpleAPIClass,
                    IntPtr.Zero,
                    "startJob",
                    "(Ljava/lang/String;Ljava/util/Map;)Lorg/daisy/pipeline/job/Job;",
                    scriptName,
                    hashMap
                );

                return job;
            }
            catch (Exception e)
            {
                if (OnPipelineError != null)
                {
                    OnPipelineError(e.Message);
                    while (e.InnerException != null)
                    {
                        e = e.InnerException;
                        OnPipelineError(" - Thrown by " + e.Message);
                    }
                }
                throw;
                //return IntPtr.Zero;
            }
        }





        
        /// <summary>
        /// Retrieve the current status of a pipeline job
        /// </summary>
        /// <param name="jobObject"></param>
        /// <returns></returns>
        public pipeline.job.Status.Value getStatus(IntPtr jobObject) {
            if (jobObject == IntPtr.Zero) {
                throw new Exception("Status requested on non-existing job");
            }
            string status = jni.CallMethod<string>(
                JobStatusClass,
                jni.CallMethod<IntPtr>(
                    JobClass,
                    jobObject,
                    "getStatus",
                    "()Lorg/daisy/pipeline/job/Job$Status;"
                ),
                "toString",
                "()Ljava/lang/String;");
            switch (status) {
                case "IDLE":
                    return pipeline.job.Status.Value.Idle;
                case "RUNNING":
                    return pipeline.job.Status.Value.Running;
                case "SUCCESS":
                    return pipeline.job.Status.Value.Success;
                case "ERROR":
                    return pipeline.job.Status.Value.Error;
                case "FAIL":
                    return pipeline.job.Status.Value.Fail;
                default:
                    return pipeline.job.Status.Value.Unknown;
            }
        }

        public IntPtr getContext(IntPtr jobObject) {
            if (jobObject == IntPtr.Zero) {
                throw new Exception("Context requested on non-existing job");
            }
            return jni.CallMethod<IntPtr>(
                JobClass,
                jobObject,
                "getContext",
                "()Lorg/daisy/pipeline/job/JobContext;"
            );
        }

        public IntPtr getMonitor(IntPtr jobContextObject) {
            if (jobContextObject == IntPtr.Zero) {
                throw new Exception("Monitor requested on non-existing job context");
            }
            return jni.CallMethod<IntPtr>(
                JobContextClass,
                jobContextObject,
                "getMonitor",
                "()Lorg/daisy/pipeline/job/JobMonitor;"
            );
        }

        private List<string> alreadySentMessages = null;
        public IntPtr getMessageAccessor(IntPtr jobMonitorObject) {
            // Reinitialize the message queue
            alreadySentMessages = null;
            if (jobMonitorObject == IntPtr.Zero) {
                throw new Exception("Monitor requested on non-existing context");
            }
            return jni.CallMethod<IntPtr>(
                JobMonitorClass,
                jobMonitorObject,
                "getMessageAccessor",
                "()Lorg/daisy/common/messaging/MessageAccessor;"
            );
        }

        public string getProgress(IntPtr messageAccessorObject) {
            if (messageAccessorObject == IntPtr.Zero) {
                throw new Exception("Progress requested on non-existing message accessor");
            }

            return jni.CallMethod<string>(
                BigDecimalClass,
                jni.CallMethod<IntPtr>(
                    MessageAccessorClass,
                    messageAccessorObject,
                    "getProgress",
                    "()Ljava/math/BigDecimal;"
                ),
                "toString",
                "()Ljava/lang/String;"
                );
        }


        public List<string> getInfos(IntPtr messageAccessorObject) {
            if (alreadySentMessages == null) {
                alreadySentMessages = new List<string>();
            }
            List<string> result = new List<string>();
            if(messageAccessorObject != IntPtr.Zero) {
                IntPtr messagesList = jni.CallMethod<IntPtr>(MessageAccessorClass, messageAccessorObject, "getInfos", "()Ljava/util/List;");
                JavaIterable<IntPtr> messagesIterable = new JavaIterable<IntPtr>(jni, messagesList);
                IntPtr messageClass = IntPtr.Zero;
                foreach (IntPtr messageObject in messagesIterable) {
                    if (messageClass == IntPtr.Zero) {
                        messageClass = jni.JNIEnvironment.GetObjectClass(messageObject);
                    }
                    string message = jni.CallMethod<string>(messageClass, messageObject, "getText", "()Ljava/lang/String;");
                    if (!alreadySentMessages.Contains(message)) {
                        result.Add(message);
                        alreadySentMessages.Add(message);
                    }
                }
            }
            return result;
        }

        public List<string> getAllInfos() {
            return alreadySentMessages;
        }

        public List<string> getNewMessages() {
            List<string> messages = new List<string>();
            IntPtr messagesList = jni.CallMethod<IntPtr>(SimpleAPIClass, IntPtr.Zero, "getNewMessages", "()Ljava/util/List;");
            JavaIterable<IntPtr> messagesIterable = new JavaIterable<IntPtr>(jni, messagesList);
            IntPtr messageClass = IntPtr.Zero;
            foreach (IntPtr messageObject in messagesIterable) {
                if (messageClass == IntPtr.Zero) {
                    messageClass = jni.JNIEnvironment.GetObjectClass(messageObject);
                }
                string message = jni.CallMethod<string>(messageClass, messageObject, "getText", "()Ljava/lang/String;");
                messages.Add(message);
            }
            return messages;
        }



        public string getLastOutput() {
            return jni.CallMethod<string>(SimpleAPIClass, IntPtr.Zero, "getOutput", "()Ljava/lang/String;");
        }

        public string getLastError() {
            return jni.CallMethod<string>(SimpleAPIClass, IntPtr.Zero, "getError", "()Ljava/lang/String;");
        }

    }
}
