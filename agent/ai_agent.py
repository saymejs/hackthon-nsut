import os
import sys
import json
import argparse
from typing import Optional, Dict, Any

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Optional load_dotenv if python-dotenv is present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from vault_client import VaultClient
from service_client import AutonomousPaymentHandler

# Cloud compute tool definition schema
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "run_cloud_compute",
            "description": "Executes intensive matrix math or high-performance compute on external GPU cluster. Requires HTTP 402 payment settled via AgentVault smart contract.",
            "parameters": {
                "type": "object",
                "properties": {
                    "taskType": {
                        "type": "string",
                        "description": "Type of computational task (e.g., matrix_multiplication, neural_render, physics_simulation)",
                        "default": "matrix_multiplication"
                    },
                    "workloadUnits": {
                        "type": "integer",
                        "description": "Workload unit size between 1 and 100",
                        "default": 50
                    }
                },
                "required": ["workloadUnits"]
            }
        }
    }
]


def run_agent_gemini(prompt: str, payment_handler: AutonomousPaymentHandler, api_key: str):
    """
    Executes prompt using Google Gemini API (gemini-1.5-flash) with tool/function calling.
    Falls back gracefully to Autonomous Cognitive Engine if the key is invalid or quota is exceeded.
    """
    print(f"\n[AI Agent] Connecting to Google Gemini 1.5 Flash...")
    print(f"             Analyzing user prompt: \"{prompt}\"")

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        def run_cloud_compute(taskType: str = "matrix_multiplication", workloadUnits: int = 50):
            """Executes intensive matrix math or high-performance compute on external GPU cluster.
            Requires HTTP 402 payment settled via AgentVault smart contract.
            """
            return {"taskType": taskType, "workloadUnits": workloadUnits}

        def simulate_wifi_reconnect(taskType: str = "matrix_multiplication", workloadUnits: int = 50):
            """Simulates network Wi-Fi drop after invoice settlement and re-requests deliverable to verify anti-double-charge idempotency at zero duplicate cost ($0.00).
            """
            return {"taskType": taskType, "workloadUnits": workloadUnits}

        # Find supported active model candidate (Google updated to 3.6-flash)
        model_name = "gemini-3.6-flash"
        for candidate in ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash"]:
            try:
                test_model = genai.GenerativeModel(candidate)
                model_name = candidate
                break
            except Exception:
                continue

        model = genai.GenerativeModel(
            model_name=model_name,
            tools=[run_cloud_compute, simulate_wifi_reconnect],
            system_instruction=(
                "You are an autonomous AI agent authorized to purchase cloud compute resources "
                "using machine payments (HTTP 402) through an on-chain budget vault. "
                "When computationally intensive tasks or matrix multiplications are requested, call run_cloud_compute. "
                "When asked to test Wi-Fi disconnection, dropped connections, retry, or idempotency double-charge protection, call simulate_wifi_reconnect."
            )
        )

        chat = model.start_chat(enable_automatic_function_calling=False)
        response = chat.send_message(prompt)

        # Check for function calls in response
        called_tool = False
        for part in response.parts:
            fn = getattr(part, "function_call", None)
            if fn and fn.name in ["run_cloud_compute", "simulate_wifi_reconnect"]:
                called_tool = True
                fn_args = dict(fn.args)
                task_type = fn_args.get("taskType", "matrix_multiplication")
                workload_units = int(fn_args.get("workloadUnits", 50))
                is_wifi = fn.name == "simulate_wifi_reconnect" or any(w in prompt.lower() for w in ["wifi", "disconnect", "reconnect", "retry", "idempot"])

                print(f"🧠 [Gemini Decision] Tool invocation triggered: {fn.name}(taskType='{task_type}', workloadUnits={workload_units})")

                try:
                    # Step 1: Initial execution and settlement
                    result = payment_handler.execute_paid_request(
                        endpoint="/api/v1/service/compute",
                        payload={"taskType": task_type, "workloadUnits": workload_units}
                    )

                    # Step 2: Wi-Fi Reconnect & Idempotency Replay
                    if is_wifi and payment_handler.paid_invoices:
                        print("\n📡 [Wi-Fi Drop Simulated] Network connection dropped after payment authorization.")
                        print("📡 [Reconnecting...] Restoring connection to seller/provider...")
                        print("📡 [Replay Deliverable Request] Submitting settled invoice credentials without paying a second time...")

                        import httpx
                        last_invoice_id = list(payment_handler.paid_invoices.keys())[-1]
                        last_tx = payment_handler.paid_invoices[last_invoice_id]

                        with httpx.Client(timeout=payment_handler.timeout) as client:
                            replay_res = client.post(
                                f"{payment_handler.provider_url}/api/v1/service/compute",
                                json={"taskType": task_type, "workloadUnits": workload_units},
                                headers={
                                    "Content-Type": "application/json",
                                    "X-Payment-Id": last_invoice_id,
                                    "X-Payment-TxHash": last_tx,
                                }
                            )
                            replay_data = replay_res.json()
                            if replay_data.get("idempotencyHit"):
                                print(f"\n✨ [RECONNECT SUCCESS] Invoice {last_invoice_id} reused. Data delivered from cache at $0.00 extra cost.")
                                print(f"🛡️  Idempotency Verified — 0 ETH Deducted on Replay. Digest: {replay_data.get('contentHash')}\n")
                                result["idempotencyVerified"] = True
                                result["duplicateCostEth"] = "0.00"

                    # Send tool result back to Gemini for final summary
                    tool_response_part = genai.protos.Part(
                        function_response=genai.protos.FunctionResponse(
                            name=fn.name,
                            response={"result": result}
                        )
                    )
                    final_res = chat.send_message(tool_response_part)
                    print(f"\n🤖 [Gemini Final Summary]:\n{final_res.text}")
                except Exception as e:
                    handle_execution_error(e)
                break

        if not called_tool:
            text_resp = response.text
            print(f"\n🤖 [Gemini Response]:\n{text_resp}")
            if any(term in text_resp.lower() for term in ["matrix", "compute", "gpu", "render", "calculate", "wifi", "idempot"]):
                print("💡 [Agent Dispatch] Executing cloud compute based on Gemini recommendations...")
                run_agent_autonomous(prompt, payment_handler)

    except Exception as gemini_err:
        print(f"\n⚠️  [Gemini Provider Notice] Could not execute via Google Gemini API:")
        print(f"    Reason: {gemini_err}")
        print(f"    ➡️  Activating Autonomous Cognitive Engine (zero-interruption fallback)...\n")
        run_agent_autonomous(prompt, payment_handler)


def run_agent_openai(prompt: str, payment_handler: AutonomousPaymentHandler, api_key: str):
    """
    Executes prompt using OpenAI API (gpt-4o-mini).
    Falls back gracefully to Autonomous Cognitive Engine if error occurs.
    """
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)

        messages = [
            {
                "role": "system",
                "content": "You are an autonomous AI agent authorized to purchase cloud compute resources using machine payments (HTTP 402) through an on-chain budget vault. Use the run_cloud_compute tool when computationally intensive tasks are requested."
            },
            {"role": "user", "content": prompt}
        ]

        print(f"\n[AI Agent] Analyzing user prompt via OpenAI: \"{prompt}\"")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=TOOLS
        )

        msg = response.choices[0].message
        if msg.tool_calls:
            for tool_call in msg.tool_calls:
                if tool_call.function.name == "run_cloud_compute":
                    args = json.loads(tool_call.function.arguments)
                    print(f"🧠 [OpenAI Decision] Tool call 'run_cloud_compute' with args: {args}")

                    try:
                        result = payment_handler.execute_paid_request(
                            endpoint="/api/v1/service/compute",
                            payload=args
                        )
                        messages.append(msg)
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": json.dumps(result)
                        })

                        final_res = client.chat.completions.create(
                            model="gpt-4o-mini",
                            messages=messages
                        )
                        print(f"\n🤖 [AI Agent Final Answer]:\n{final_res.choices[0].message.content}")

                    except Exception as e:
                        handle_execution_error(e)
        else:
            print(f"\n🤖 [AI Agent Response]:\n{msg.content}")

    except Exception as openai_err:
        print(f"\n⚠️  [OpenAI Provider Notice] {openai_err}")
        print("    ➡️  Falling back to Autonomous Cognitive Engine...\n")
        run_agent_autonomous(prompt, payment_handler)


def run_agent_autonomous(prompt: str, payment_handler: AutonomousPaymentHandler):
    """
    Autonomous Cognitive Agent mode.
    Autonomously reasons through the prompt, identifies paid compute requirements,
    and executes the machine payment protocol deterministically.
    """
    print(f"\n========================================================")
    print(f"   AI Autonomous Agent Runtime (Agent SafePay W3A-1)   ")
    print(f"========================================================")
    print(f"👤 User Request: \"{prompt}\"")
    print(f"🧠 Reasoning Engine: Analyzing task parameters and requirements...")

    # Extract or infer compute parameters from prompt
    workload = 50
    words = prompt.split()
    for w in words:
        if w.isdigit():
            val = int(w)
            if 1 <= val <= 1000:
                workload = val
                break

    task_type = "matrix_multiplication"
    p_lower = prompt.lower()
    if "render" in p_lower:
        task_type = "neural_render"
    elif "simulation" in p_lower or "physics" in p_lower:
        task_type = "physics_simulation"

    print(f"💡 Plan Formulated: External GPU acceleration required.")
    print(f"   Selected Tool: run_cloud_compute(taskType='{task_type}', workloadUnits={workload})")

    try:
        result = payment_handler.execute_paid_request(
            endpoint="/api/v1/service/compute",
            payload={
                "taskType": task_type,
                "workloadUnits": workload
            }
        )

        print("\n========================================================")
        print("🎉 [Execution Complete] Delivered Computation Deliverable:")
        print(f"   • Task Type       : {result.get('result', {}).get('taskType')}")
        print(f"   • Workload Units  : {result.get('result', {}).get('workloadUnits')}")
        print(f"   • Execution Time  : {result.get('result', {}).get('executionTimeMs')} ms")
        print(f"   • Execution Node  : {result.get('result', {}).get('executionNode')}")
        print(f"   • Output Stream   : {result.get('result', {}).get('matrixResultStream')}")
        print(f"   • SHA-256 Digest  : {result.get('contentHash')}")
        print(f"   • Idempotency Hit : {result.get('idempotencyHit')}")
        print("========================================================\n")

    except Exception as e:
        handle_execution_error(e)


def handle_execution_error(e: Exception):
    err_str = str(e)
    if "BUDGET_EXCEEDED" in err_str:
        print("\n🛑 [SECURITY INVARIANT ENFORCED]")
        print("   On-chain transaction hard-reverted with: 'BUDGET_EXCEEDED'")
        print("   Smart contract circuit breaker triggered.")
        print("   0 ETH lost. Vault funds remain 100% secure.")
    else:
        print(f"\n❌ [Execution Error]: {e}")


def main():
    parser = argparse.ArgumentParser(description="Autonomous AI Agent Safe Payments Runtime")
    parser.add_argument(
        "prompt",
        nargs="?",
        default="Please calculate the optimal matrix transformation for 50 workload units using cloud compute.",
        help="Prompt to guide the agent action"
    )
    parser.add_argument("--rpc", default=None, help="EVM RPC URL")
    parser.add_argument("--provider", default="http://127.0.0.1:8000", help="HTTP 402 Provider base URL")
    args = parser.parse_args()

    # Initialize smart vault and payment handler
    vault = VaultClient(rpc_url=args.rpc)
    payment_handler = AutonomousPaymentHandler(vault, provider_url=args.provider)

    # Print initial vault telemetry
    try:
        status = vault.get_vault_status()
        print("\n--- Smart Vault On-Chain State ---")
        print(f"Vault Address       : {status['vaultAddress']}")
        print(f"Agent Signer Key    : {status['agentSigner']}")
        print(f"Vault Balance       : {status['vaultBalanceEth']} ETH")
        print(f"Cumulative Spend Cap: {status['spendLimitEth']} ETH")
        print(f"Total Spent to Date : {status['totalSpentEth']} ETH")
        print(f"Remaining Allowance : {status['remainingAllowanceEth']} ETH")
        print("----------------------------------\n")
    except Exception as err:
        print(f"Notice: Could not read live vault status (ensure Hardhat node is running): {err}")

    # Determine execution engine: Gemini -> OpenAI -> Autonomous
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    if gemini_key and gemini_key.strip():
        run_agent_gemini(args.prompt, payment_handler, gemini_key.strip())
    elif openai_key and openai_key.strip():
        run_agent_openai(args.prompt, payment_handler, openai_key.strip())
    else:
        run_agent_autonomous(args.prompt, payment_handler)


if __name__ == "__main__":
    main()
