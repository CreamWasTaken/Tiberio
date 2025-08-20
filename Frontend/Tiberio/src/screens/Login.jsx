import { useState } from 'react'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle login logic here
    console.log('Login attempt:', formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <img 
              src="/TiberioLogo.jpg" 
              alt="Tiberio Eye Clinic Logo" 
              className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg"
            />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
              Tiberio Eye Clinic
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed">
              Welcome back! Please sign in to your account.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-gray-200 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className="w-full px-5 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-gray-200 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                className="w-full px-5 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-400 bg-gray-700 border-gray-600 rounded focus:ring-blue-400 focus:ring-2"
                />
                <span className="ml-2">Remember me</span>
              </label>
            </div>
            
            <button 
              type="submit" 
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Sign In
            </button>
          </form>
          
          {/* <div className="text-center mt-8 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200">
                Sign up
              </a>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  )
}

export default Login
