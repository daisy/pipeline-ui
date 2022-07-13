using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace org.daisy.pipeline.script
{
    public class Parameter
    {
        public enum TypeCategory
        {
            /// <summary>
            /// p:input in the script <br/>
            /// - Should be mapped to the global input for the primary one <br/>
            /// - Can be mapped to a new field for non-primary
            /// </summary>
            Input,
            /// <summary>
            /// p:output in the script
            /// 
            /// </summary>
            Output,
            /// <summary>
            /// p:option in the script
            /// </summary>
            Option
        }

        public static class DataType
        {

            public enum Value
            {
                String,
                Integer,
                Boolean,
                Directory,
                File,
                Unknown
            }

            public static Value FromId(string id)
            {
                switch (id)
                {
                    case "string":
                    case "String":
                        return Value.String;
                    case "integer":
                    case "Integer":
                        return Value.Integer;
                    case "boolean":
                    case "Boolean":
                        return Value.Boolean;
                    case "anyDirURI":
                    case "AnyDirURI":
                    case "Directory":
                        return Value.Directory;
                    case "anyFileURI":
                    case "AnyFileURI":
                    case "File":
                        return Value.File;
                    case "unknown":
                    case "Unknown":
                    default:
                        return Value.Unknown;
                }
            }
            //public static string ToString(Value id)
            //{
            //    switch (id)
            //    {
            //        case Value.String:
            //            return "string";
            //        case Value.Integer:
            //            return "integer";
            //        case Value.Boolean:
            //            return "boolean";
            //        case Value.Directory:
            //            return "anyDirURI";
            //        case Value.File:
            //            return "anyFileURI";
            //        default:
            //            return "unknown";
            //    }
            //}
        }

        public Parameter(string NameOrPort, Parameter.TypeCategory typeCategory)
        {
            this.NameOrPort = NameOrPort;
            this.Type = typeCategory;
        }

        public string NameOrPort { get; set; }

        /// <summary>
        /// Name to be displayed 
        /// </summary>
        public string NiceName { get; set; } = "";

        /// <summary>
        /// For input or output parameters, precise if the port is the default one
        /// </summary>
        public bool Primary { get; set; } = true;

        /// <summary>
        /// Html documentation the could be associated with the 
        /// </summary>
        public string Documentation { get; set; } = "";

        public bool Required { get; set; } = false;

        /// <summary>
        /// Type of parameter within the script
        /// (p:input, p:output or p:option)
        /// </summary>
        public Parameter.TypeCategory Type { get; set; }

        public DataType.Value DataTypeValue { get; set; } = DataType.Value.String;

        /// <summary>
        /// Type of media expected
        /// (for example in the pipeline script with px:media-type="application/x-dtbook+xml"
        /// This will be application/x-dtbook+xml)
        /// </summary>
        public string? MediaType { get; set; }

        public object? DefaultValue { get; set; }

        /// <summary>
        /// Added value for user custom default value for repetitive (just an idea)
        /// will be stored using the MAUI "Preferences"
        /// https://docs.microsoft.com/en-us/dotnet/maui/platform-integration/storage/preferences?tabs=windows
        /// </summary>
        public object? UserValue { get; set; }


        

    }
}
