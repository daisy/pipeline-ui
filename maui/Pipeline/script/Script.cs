
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace org.daisy.pipeline
{

    /// <summary>
    /// Script to run, including parameters
    /// </summary>
    public class Script
    {
        public string ID { get; set; }

        public string? Name { get; set; }

        public string? Description { get; set; }

        public List<script.Parameter> Parameters { get; set; } = new List<script.Parameter> { };

        public Script(string ID)
        {
            this.ID = ID;
        }

        /// <summary>
        /// Run a script on a pipeline instance and return a job pointer
        /// </summary>
        /// <param name="parametersValues"></param>
        /// <returns></returns>
        public IntPtr run(Dictionary<string, object> parametersValues, ref Pipeline onInstance)
        {
            try
            {
                Dictionary<string, string> convertedParameters = new Dictionary<string, string>();
                foreach (script.Parameter opt in Parameters)
                {
                    if(opt.Type != script.Parameter.TypeCategory.Output)
                    {
                        string parameterValue = (opt.UserValue ?? opt.DefaultValue ?? "").ToString();
                        if (parametersValues.ContainsKey(opt.NameOrPort))
                        {
                            parameterValue = parametersValues[opt.NameOrPort].ToString();
                        }
                        if (!string.IsNullOrEmpty(parameterValue))
                        {
                            if(parameterValue == "True" || parameterValue == "False")
                            {
                                parameterValue = parameterValue.ToLower();
                            }
                            convertedParameters.Add(opt.NameOrPort, parameterValue);
                        }
                    }
                }
                return onInstance.Start(ID, convertedParameters);
            }
            catch (Exception)
            {
                throw;
            }   
        }
    }
}
