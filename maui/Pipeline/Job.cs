
using org.daisy.pipeline.job;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace org.daisy.pipeline
{
    namespace job
    {
        /// <summary>
        /// Possible status for a pipeline job
        /// </summary>
        
        public class JobException : Exception
        {
            public Job JobInError;
            public JobException(Job jobInError, string message, Exception? innerException) : base(message, innerException)
            {
                JobInError = jobInError;
            }
        }

        public static class Status
        {
            public enum Value
            {
                Launching,
                Idle,
                Running,
                Success,
                Error,
                Fail,
                Unknown

            }

            public static Status.Value FromString(string value)
            {
                switch (value)
                {
                    case "idle":
                    case "Idle":
                        return Status.Value.Idle;
                    case "running":
                    case "Running":
                        return Status.Value.Running;
                    case "success":
                    case "Success":
                        return Status.Value.Success;
                    case "error":
                    case "Error":
                        return Status.Value.Error;
                    case "fail":
                    case "Fail":
                        return Status.Value.Fail;
                    case "unknown":
                    case "Unknown":
                    default:
                        return Status.Value.Unknown;
                }
            }
            //public static string ToString(Status.Value value)
            //{
            //    switch (value)
            //    {
            //        case Status.Value.Idle:
            //            return "idle";
            //        case Status.Value.Running:
            //            return "running";
            //        case Status.Value.Success:
            //            return "success";
            //        case Status.Value.Error:
            //            return "error";
            //        case Status.Value.Fail:
            //            return "fail";
            //        case Status.Value.Unknown:
            //        default:
            //            return "unknown";
            //    }
            //}
        }

        public class JobUpdateEventArgs : EventArgs
        {
            public Status.Value OldStatus;
            public Status.Value NewStatus;
            public int LastErrorCode;
            public List<string>? Messages;
        }

    }
    /// <summary>
    /// Manage job 
    /// </summary>
    public class Job
    {

        public List<string> Messages { get; private set; }

        private IntPtr javaJob = IntPtr.Zero, javaJobMessageAccessor = IntPtr.Zero;

        public EventHandler<JobUpdateEventArgs>? onUpdate;

        public pipeline.Script Script { get; }

        public Dictionary<string, object> Parameters { get; private set; }


        /// <summary>
        /// 
        /// </summary>
        public Status.Value StatusValue { get; private set; } = Status.Value.Unknown;


        public string ID
        {
            get;
        }

        public string Progression { get; private set; } = "-1";
        public bool Running
        {
            get
            {
                return !(StatusValue ==  Status.Value.Success
                    || StatusValue ==  Status.Value.Fail
                    || StatusValue == Status.Value.Error 
                    || javaJob == IntPtr.Zero);
            }
        }
        public int requestUpdate(ref Pipeline onInstance)
        {
            int errorCode = 0;
            // get status from pipeline
            Status.Value oldStatus = this.StatusValue;
            // Check for terminated states
            switch (oldStatus)
            {
                case Status.Value.Success:
                    return 0;
                case Status.Value.Fail:
                    return 1;
                case Status.Value.Error:
                    return 2;
                default:break;
            }
            this.StatusValue = javaJob == IntPtr.Zero ? (oldStatus != Status.Value.Launching ? Status.Value.Unknown : oldStatus) : onInstance.getStatus(javaJob);
            switch (this.StatusValue)
            {
                case Status.Value.Unknown:
                    Messages.Add($"The job is in an unknown state : pointer has been reset to 0 after the job was launched");
                    errorCode = -2;
                    break;
                case Status.Value.Launching:
                    Messages = new List<string>(){ $"job is launching" };
                    errorCode = -1;
                    break;
                case Status.Value.Success:
                    Messages.Add($"The job has successfully completed");
                    goto default;
                // Retrieve outputs
                case Status.Value.Fail:
                    Messages.Add($"The job has failed");
                    errorCode = 1;
                    goto default;
                case Status.Value.Error:
                    Messages.Add($"The job is in error, please consult the log");
                    errorCode = 2;
                    goto default;
                case Status.Value.Running:
                default:
                    // Retrieve log, update progression
                    if(javaJobMessageAccessor != IntPtr.Zero)
                    {
                        this.Progression = onInstance.getProgress(javaJobMessageAccessor);
                        this.Messages = onInstance.getInfos(javaJobMessageAccessor);
                    }
                    break;
            }
            Application.Current.Dispatcher.Dispatch(
                () => onUpdate?.Invoke(this, new JobUpdateEventArgs()
                {
                    OldStatus = oldStatus,
                    NewStatus = this.StatusValue,
                    LastErrorCode = errorCode,
                    Messages = this.Messages
                })
            );
            
            return errorCode;
        }

       

        /// <summary>
        /// Create and start a pipeline 2 job.
        /// Note that any input required for the job is supposed to be stored in the parameters
        /// </summary>
        /// <param name="script"></param>
        /// <param name="parameters"></param>
        public Job(Script script, Dictionary<string, object> parameters)
        {
            Script = script;
            Parameters = parameters;
            // build id as YYYY/MM/DD-hh:mm:ss
            ID = DateTime.Now.ToString("yyyyMMddHHmmssf");
            Progression = "0";
            Messages = new List<string>();
        }

        public IntPtr run(ref Pipeline onInstance)
        {
            javaJob = IntPtr.Zero;
            StatusValue = Status.Value.Launching;
            try
            {
                javaJob = Script.run(Parameters, ref onInstance);
                IntPtr _javaJobContext = onInstance.getContext(javaJob);
                IntPtr _javaJobContextMonitor = onInstance.getMonitor(_javaJobContext);
                javaJobMessageAccessor = onInstance.getMessageAccessor(_javaJobContextMonitor);
                return javaJob;
            }
            catch (Exception e)
            {
                this.StatusValue = Status.Value.Error;
                this.Messages.Add(e.Message);
                this.Messages.Add(e.StackTrace);
                Application.Current.Dispatcher.Dispatch(
                    () => onUpdate?.Invoke(this, new JobUpdateEventArgs()
                    {
                        OldStatus = StatusValue,
                        NewStatus = Status.Value.Error,
                        Messages = new List<string>()
                        {
                            e.Message,
                            e.StackTrace
                        }
                    }) 
                );
                
                
                throw new JobException(this, e.Message, e);
            }
            
        }



        /// <summary>
        /// Retrieve job data from the java job pointer
        /// </summary>
        /// <param name="javaJob"></param>
        //public Job(IntPtr javaJob, ref Pipeline onInstance)
        //{
        //    this._javaJob = javaJob;
        //    //getPipelineJobState();
        //    if (javaJob != IntPtr.Zero)
        //    {
        //        // Retrieve data from the pipeline (script and parameters)

        //        // Retrieve java objects
        //        _javaJobContext = Pipeline.Instance.getContext(javaJob);
        //        _javaJobContextMonitor = Pipeline.Instance.getMonitor(_javaJobContext);
        //        _javaJobMessageAccessor = Pipeline.Instance.getMessageAccessor(_javaJobContextMonitor);

        //        //JobMonitor = Task.Run(() =>
        //        //{
        //            int errorCode = 0;
        //            do
        //            {
        //                errorCode = getPipelineJobState();

        //                Thread.Sleep(250);
        //            } while (this.StatusValue == Status.Value.Running || this.StatusValue == Status.Value.Idle);

        //        //    return errorCode; ;
        //        //});
        //    }
        //}


    }
}
